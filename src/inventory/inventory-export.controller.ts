import { BadGatewayException, Controller, Get, Injectable, Logger, StreamableFile, UseGuards } from "@nestjs/common";
import { Readable } from "node:stream";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { KiraService } from "./kira.service";
import { EasysoftService } from "./easysoft.service";

type CsvRecord = Record<string, string>;

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (quoted) {
    throw new BadGatewayException("Bright CSV contains an unfinished quoted field.");
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const trimmed = text.trimStart();
  if (/^[=+@]/.test(trimmed) || (/^-/.test(trimmed) && !/^-\d+(\.\d+)?$/.test(trimmed))) {
    text = "'" + text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

// =====================================================
// SERVICE  (must be declared BEFORE the controller so
// that TypeScript decorator metadata can reference it)
// =====================================================
@Injectable()
export class InventoryExportService {
  private readonly logger = new Logger(InventoryExportService.name);

  constructor(
    private readonly kiraService: KiraService,
    private readonly easysoftService: EasysoftService,
  ) {}

  async downloadCombinedCsv(): Promise<Readable> {
    const startedAt = Date.now();
    this.logger.log("Combined CSV export: requesting Bright and Easysoft inventories...");

    const [brightCsv, easysoftRecords] = await Promise.all([
      (async () => {
        const start = Date.now();
        try {
          return await this.readBrightCsv();
        } finally {
          this.logger.log(
            `Bright inventory fetch took ${((Date.now() - start) / 1000).toFixed(2)} seconds`,
          );
        }
      })(),

      (async () => {
        const start = Date.now();
        try {
          return await this.easysoftService.getDiamondList();
        } finally {
          this.logger.log(
            `Easysoft inventory fetch took ${((Date.now() - start) / 1000).toFixed(2)} seconds`,
          );
        }
      })(),
    ]);

    const parsed = parseCsv(brightCsv);
    if (!parsed.length || !parsed[0].some(Boolean)) {
      throw new BadGatewayException("Bright inventory returned no valid CSV headers.");
    }
    if (!Array.isArray(easysoftRecords) || !easysoftRecords.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
      throw new BadGatewayException("Easysoft inventory returned invalid records.");
    }

    const [brightHeaders, ...brightRows] = parsed;
    const seen = new Map<string, number>();
    const safeBrightHeaders = brightHeaders.map((header, index) => {
      const base = header || `Column_${index + 1}`;
      const next = (seen.get(base) || 0) + 1;
      seen.set(base, next);
      return next === 1 ? base : `${base}_${next}`;
    });
    const easysoftHeaders = [...new Set(easysoftRecords.flatMap((record) => Object.keys(record)))];
    const headers = ["Supplier", ...new Set([...safeBrightHeaders, ...easysoftHeaders].filter((h) => h !== "Supplier"))];

    const batchSize = 256 * 1024;
    const serviceLogger = this.logger;
    function* output(): Generator<string> {
      let batch = "\uFEFF" + headers.map(csvCell).join(",") + "\r\n";
      let count = 0;
      try {
        for (const values of brightRows) {
          const record: CsvRecord = {};
          safeBrightHeaders.forEach((header, index) => {
            record[header] = values[index] ?? "";
          });
          batch += headers.map((header) => csvCell(header === "Supplier" ? "Bright" : record[header])).join(",") + "\r\n";
          count++;
          if (batch.length >= batchSize) {
            yield batch;
            batch = "";
          }
        }
        for (const record of easysoftRecords) {
          batch += headers.map((header) => csvCell(header === "Supplier" ? "Easysoft" : record[header])).join(",") + "\r\n";
          count++;
          if (batch.length >= batchSize) {
            yield batch;
            batch = "";
          }
        }
        if (batch) yield batch;
        serviceLogger.log(`Combined CSV generation completed: ${count} data rows.`);
      } catch (error) {
        serviceLogger.error("Combined CSV generation failed", error instanceof Error ? error.stack : String(error));
        throw error;
      }
    }

    this.logger.log(
      `Combined CSV ready to send: ${brightRows.length} Bright + ${easysoftRecords.length} Easysoft rows; ${headers.length} columns; preparation took ${Date.now() - startedAt}ms.`,
    );

    const stream = Readable.from(output(), { objectMode: false });
    stream.once("end", () => this.logger.log("Combined CSV stream ended successfully."));
    stream.once("error", (error) => this.logger.error(`Combined CSV stream error: ${error.message}`, error.stack));
    return stream;
  }

  private async readBrightCsv(): Promise<string> {
    const stream = await this.kiraService.downloadFullInventoryCsv();
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    } catch (error) {
      this.logger.error("Bright CSV supplier stream failed", error instanceof Error ? error.stack : String(error));
      throw new BadGatewayException("Bright inventory download failed; combined export cancelled.");
    }
    return Buffer.concat(chunks).toString("utf8");
  }
}

// =====================================================
// CONTROLLER  (declared AFTER the service so metadata
// can safely reference InventoryExportService)
// =====================================================
@Controller("inventory")
export class InventoryExportController {
  constructor(private readonly exportService: InventoryExportService) {}

  @Get("export")
  @UseGuards(JwtAuthGuard)
  async exportAllInventory(): Promise<StreamableFile> {
    const csvStream = await this.exportService.downloadCombinedCsv();

    const date = new Date().toISOString().slice(0, 10);

    return new StreamableFile(csvStream, {
      type: "text/csv; charset=utf-8",
      disposition: `attachment; filename="bright-trading-full-inventory-${date}.csv"`,
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { randomUUID } from 'node:crypto';

import { parse } from 'csv-parse';

import { Readable } from 'node:stream';

import { Diamond, DiamondDocument } from './schemas/diamond.schema';

import { mapKiraCsvRow } from './kira-diamond.mapper';

import { KIRA_DB_CONNECTION } from '../database/database.constants';

/* =========================================================
   TYPES
========================================================= */

type UploadDiamond = {
  stoneNo: string;
  [key: string]: unknown;
};

type UploadResult = {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  runId: string;
};

/* =========================================================
   SERVICE
========================================================= */

@Injectable()
export class InventoryUploadService {
  private readonly logger = new Logger(InventoryUploadService.name);

  private uploadRunning = false;

  constructor(
    @InjectModel(Diamond.name, KIRA_DB_CONNECTION)
    private readonly diamondModel: Model<DiamondDocument>,
  ) {}

  /* -------------------------------------------------------
     PUBLIC: processUpload
     Called by the controller with the raw file buffer.
  ------------------------------------------------------- */

  async processUpload(
    buffer: Buffer,
    originalName: string,
  ): Promise<UploadResult> {
    if (this.uploadRunning) {
      throw new ConflictException(
        'An inventory upload is already in progress. Please wait for it to finish.',
      );
    }

    this.uploadRunning = true;

    try {
      const ext = originalName.split('.').pop()?.toLowerCase() ?? '';

      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        throw new BadRequestException(
          'Only .csv, .xlsx, and .xls files are accepted.',
        );
      }

      /*
       * Convert Excel to CSV text if needed,
       * otherwise use the buffer directly as UTF-8 text.
       */
      const csvText =
        ext === 'csv'
          ? buffer.toString('utf8')
          : await this.excelBufferToCsv(buffer);

      return await this.parseCsvAndUpsert(csvText);
    } finally {
      this.uploadRunning = false;
    }
  }

  /* -------------------------------------------------------
     PRIVATE: excelBufferToCsv
     Converts an Excel buffer to a plain CSV string.
     Uses a simple but reliable row/cell extraction
     compatible with the xlsx package already available
     via @nestjs/platform-express's dependency tree.
     We avoid adding a new package by using a lightweight
     approach: parse the xlsx XML directly.
     If xlsx is not available we throw a clear error.
  ------------------------------------------------------- */

  private async excelBufferToCsv(buffer: Buffer): Promise<string> {
    /*
     * Dynamically require xlsx so the app still starts
     * even if the package is not installed — it will
     * only fail at upload time, not at boot time.
     */
    let xlsx: typeof import('xlsx');

    try {
      xlsx = await import('xlsx');
    } catch {
      throw new BadRequestException(
        'Excel file support requires the "xlsx" package. ' +
          'Please install it (npm install xlsx) or upload a CSV file instead.',
      );
    }

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('The Excel file contains no sheets.');
    }

    const sheet = workbook.Sheets[sheetName];
    const csvText = xlsx.utils.sheet_to_csv(sheet, { blankrows: false });

    if (!csvText?.trim()) {
      throw new BadRequestException('The Excel sheet appears to be empty.');
    }

    return csvText;
  }

  /* -------------------------------------------------------
     PRIVATE: parseCsvAndUpsert
     Parse CSV text → map rows → bulk upsert into MongoDB.
  ------------------------------------------------------- */

  private async parseCsvAndUpsert(csvText: string): Promise<UploadResult> {
    const runId = randomUUID();
    const now = new Date();

    const rows = await this.parseCsv(csvText);

    if (rows.length === 0) {
      throw new BadRequestException(
        'The uploaded file contained no valid diamond rows.',
      );
    }

    this.logger.log(
      `Upload run ${runId}: parsing ${rows.length} CSV rows…`,
    );

    const diamonds: UploadDiamond[] = [];
    let skipped = 0;

    for (const row of rows) {
      const mapped = mapKiraCsvRow(row as Record<string, unknown>);

      if (!mapped) {
        skipped++;
        continue;
      }

      diamonds.push(mapped as UploadDiamond);
    }

    if (diamonds.length === 0) {
      throw new BadRequestException(
        `All ${rows.length} rows were skipped — no valid StoneNo column found. ` +
          'Check that your file has the correct column headers.',
      );
    }

    /* --------------------------------------------------
       Bulk upsert in batches of 750
    -------------------------------------------------- */

    const BATCH_SIZE = 750;
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < diamonds.length; i += BATCH_SIZE) {
      const batch = diamonds.slice(i, i + BATCH_SIZE);

      const operations = batch.map((diamond) => ({
        updateOne: {
          filter: { stoneNo: diamond.stoneNo },
          update: {
            $set: {
              ...diamond,
              hasFullDetails: true,
              detailSource: 'FULL',
              fullSyncRunId: runId,
              lastSeenAt: now,
            },
          },
          upsert: true,
        },
      }));

      const result = await this.diamondModel.bulkWrite(operations, {
        ordered: false,
      });

      inserted += result.upsertedCount;
      updated += result.modifiedCount;

      this.logger.log(
        `Upload batch ${Math.ceil((i + BATCH_SIZE) / BATCH_SIZE)}: ` +
          `inserted ${result.upsertedCount}, updated ${result.modifiedCount}`,
      );
    }

    this.logger.log(
      `Upload run ${runId} complete: ` +
        `${inserted} inserted, ${updated} updated, ${skipped} skipped`,
    );

    return {
      inserted,
      updated,
      skipped,
      total: diamonds.length,
      runId,
    };
  }

  /* -------------------------------------------------------
     PRIVATE: parseCsv
     Parses raw CSV text into an array of row objects
     using csv-parse (already in package.json).
  ------------------------------------------------------- */

  private parseCsv(text: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = [];

      const parser = Readable.from([text]).pipe(
        parse({
          columns: true,
          bom: true,
          trim: true,
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
        }),
      );

      parser.on('data', (row: Record<string, string>) => {
        rows.push(row);
      });

      parser.on('error', reject);

      parser.on('end', () => {
        resolve(rows);
      });
    });
  }
}

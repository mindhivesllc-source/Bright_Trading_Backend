// import { BadGatewayException, Injectable, Logger } from "@nestjs/common";

// import { ConfigService } from "@nestjs/config";

// import { HttpService } from "@nestjs/axios";

// export type EasysoftApiResponse = {
//   record?: Record<string, unknown>[];
// };

// @Injectable()
// export class EasysoftService {
//   private readonly logger = new Logger(EasysoftService.name);

//   private readonly apiUrl: string;
//   private readonly authorization: string;
//   private readonly enabled: boolean;

//   constructor(
//     private readonly httpService: HttpService,

//     private readonly configService: ConfigService,
//   ) {
//     this.apiUrl =
//       this.configService.get<string>("EASYSOFT_API_URL") ||
//       "https://brainapis.com/api/bright-dia/ext-client/diamond-list";

//     this.authorization =
//       this.configService.get<string>("EASYSOFT_AUTHORIZATION") || "";

//     this.enabled =
//       String(this.configService.get<string>("EASYSOFT_SYNC_ENABLED") ?? "true")
//         .trim()
//         .toLowerCase() !== "false";
//   }

//   isEnabled(): boolean {
//     return this.enabled;
//   }

//   async getDiamondList(): Promise<Record<string, unknown>[]> {
//     if (!this.enabled) {
//       return [];
//     }

//     if (!this.authorization) {
//       throw new BadGatewayException(
//         "EASYSOFT_AUTHORIZATION is not configured on the server.",
//       );
//     }

//     try {
//       const response =
//         await this.httpService.axiosRef.request<EasysoftApiResponse>({
//           method: "POST",

//           url: this.apiUrl,

//           headers: {
//             Accept: "application/json",

//             Authorization: this.authorization.trim(),
//           },

//           // IMPORTANT:
//           // Do NOT send data/body.
//           // Do NOT manually send Content-Type.

//           timeout: 180_000,

//           maxContentLength: Infinity,

//           maxBodyLength: Infinity,
//         });

//       const records = response.data?.record;

//       if (!Array.isArray(records)) {
//         throw new BadGatewayException(
//           "Easysoft returned an invalid inventory response. Expected response.record to be an array.",
//         );
//       }

//       return records;
//     } catch (error) {
//       if (error instanceof BadGatewayException) {
//         throw error;
//       }

//       const axiosError = error as {
//         code?: string;
//         message?: string;
//         response?: {
//           status?: number;
//           data?: unknown;
//         };
//       };

//       const status = axiosError.response?.status;

//       const code = axiosError.code;

//       this.logger.error(
//         `Easysoft request failed | ` +
//           `status=${status ?? "none"} | ` +
//           `code=${code ?? "none"} | ` +
//           `message=${axiosError.message ?? "unknown"} | ` +
//           `response=${
//             axiosError.response?.data
//               ? JSON.stringify(axiosError.response.data).slice(0, 1000)
//               : "none"
//           }`,
//       );

//       if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
//         throw new BadGatewayException(
//           "Easysoft API connection timed out while downloading inventory.",
//         );
//       }

//       if (code === "ECONNRESET") {
//         throw new BadGatewayException(
//           "Easysoft closed the connection while inventory was downloading.",
//         );
//       }

//       if (status === 401 || status === 403) {
//         throw new BadGatewayException(
//           "Easysoft rejected the Authorization key.",
//         );
//       }

//       if (status === 429) {
//         throw new BadGatewayException("Easysoft API rate limit exceeded.");
//       }

//       if (status === 408 || status === 504) {
//         throw new BadGatewayException("Easysoft API request timed out.");
//       }

//       throw new BadGatewayException(
//         `Easysoft inventory download failed${
//           status ? ` with HTTP ${status}` : code ? ` with ${code}` : ""
//         }.`,
//       );
//     }
//   }

//   private getStatus(error: unknown): number | undefined {
//     if (error && typeof error === "object" && "response" in error) {
//       return (
//         error as {
//           response?: {
//             status?: number;
//           };
//         }
//       ).response?.status;
//     }

//     return undefined;
//   }
// }





import {
  BadGatewayException,
  Injectable,
  Logger,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { Readable } from "node:stream";

export type EasysoftApiResponse = {
  record?: Record<string, unknown>[];
};

@Injectable()
export class EasysoftService {
  private readonly logger = new Logger(
    EasysoftService.name,
  );

  private readonly apiUrl: string;
  private readonly authorization: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>(
        "EASYSOFT_API_URL",
      ) ||
      "https://brainapis.com/api/bright-dia/ext-client/diamond-list";

    this.authorization =
      this.configService.get<string>(
        "EASYSOFT_AUTHORIZATION",
      ) || "";

    this.enabled =
      String(
        this.configService.get<string>(
          "EASYSOFT_SYNC_ENABLED",
        ) ?? "true",
      )
        .trim()
        .toLowerCase() !== "false";
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // =====================================
  // FETCH EASYSOFT INVENTORY
  // EXISTING FUNCTION PRESERVED
  // =====================================

  async getDiamondList(): Promise<
    Record<string, unknown>[]
  > {
    if (!this.enabled) {
      return [];
    }

    if (!this.authorization.trim()) {
      throw new BadGatewayException(
        "EASYSOFT_AUTHORIZATION is not configured on the server.",
      );
    }

    try {
      const response =
        await this.httpService.axiosRef.request<
          EasysoftApiResponse
        >({
          method: "POST",

          url: this.apiUrl,

          headers: {
            Accept: "application/json",
            Authorization:
              this.authorization.trim(),
          },

          // No request body.
          // No manually assigned Content-Type.

          timeout: 180_000,

          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

      const records = response.data?.record;

      if (!Array.isArray(records)) {
        throw new BadGatewayException(
          "Easysoft returned an invalid inventory response. Expected response.record to be an array.",
        );
      }

      if (
        !records.every(
          (record) =>
            record !== null &&
            typeof record === "object" &&
            !Array.isArray(record),
        )
      ) {
        throw new BadGatewayException(
          "Easysoft returned invalid inventory records.",
        );
      }

      this.logger.log(
        `Easysoft inventory fetched: ${records.length} records.`,
      );

      return records;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const axiosError = error as {
        code?: string;
        message?: string;
        response?: {
          status?: number;
        };
      };

      const status =
        axiosError.response?.status;

      const code = axiosError.code;

      this.logger.error(
        `Easysoft request failed | status=${status ?? "none"} | code=${code ?? "none"} | message=${axiosError.message ?? "unknown"}`,
      );

      if (
        code === "ECONNABORTED" ||
        code === "ETIMEDOUT"
      ) {
        throw new BadGatewayException(
          "Easysoft API connection timed out while downloading inventory.",
        );
      }

      if (code === "ECONNRESET") {
        throw new BadGatewayException(
          "Easysoft closed the connection while inventory was downloading.",
        );
      }

      if (status === 401 || status === 403) {
        throw new BadGatewayException(
          "Easysoft rejected the Authorization key.",
        );
      }

      if (status === 429) {
        throw new BadGatewayException(
          "Easysoft API rate limit exceeded.",
        );
      }

      if (status === 408 || status === 504) {
        throw new BadGatewayException(
          "Easysoft API request timed out.",
        );
      }

      throw new BadGatewayException(
        `Easysoft inventory download failed${
          status
            ? ` with HTTP ${status}`
            : code
              ? ` with ${code}`
              : ""
        }.`,
      );
    }
  }

  // =====================================
  // NEW: FULL INVENTORY CSV EXPORT
  // =====================================

  async downloadInventoryCsv(): Promise<Readable> {
    if (!this.enabled) {
      throw new BadGatewayException(
        "Easysoft inventory export is disabled.",
      );
    }

    // Reuse existing fetch logic.
    const records = await this.getDiamondList();

    if (records.length === 0) {
      throw new BadGatewayException(
        "Easysoft returned no inventory records to export.",
      );
    }

    // Collect every available column.
    const headers = Array.from(
      new Set(
        records.flatMap((record) =>
          Object.keys(record),
        ),
      ),
    );

    if (headers.length === 0) {
      throw new BadGatewayException(
        "Easysoft inventory has no exportable columns.",
      );
    }

    const escapeCsv = (
      value: unknown,
    ): string => {
      let text = "";

      if (value !== null && value !== undefined) {
        text =
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      }

      // Protect against spreadsheet formula injection.
      const trimmed = text.trimStart();

      const dangerous =
        /^[=+@]/.test(trimmed) ||
        (/^-/.test(trimmed) &&
          !/^-\d+(\.\d+)?$/.test(trimmed));

      if (dangerous) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    // Stream CSV rows rather than constructing
    // one large CSV string in memory.
    function* generateCsv(): Generator<string> {
      // Excel UTF-8 BOM.
      yield "\uFEFF";

      // Header row.
      yield (
        headers.map(escapeCsv).join(",") +
        "\r\n"
      );

      // Data rows.
      for (const record of records) {
        yield (
          headers
            .map((header) =>
              escapeCsv(record[header]),
            )
            .join(",") + "\r\n"
        );
      }
    }

    this.logger.log(
      `Easysoft CSV ready: ${records.length} records.`,
    );

    return Readable.from(generateCsv());
  }

  // =====================================
  // OPTIONAL STATUS HELPER
  // =====================================

  private getStatus(
    error: unknown,
  ): number | undefined {
    if (
      error &&
      typeof error === "object" &&
      "response" in error
    ) {
      return (
        error as {
          response?: {
            status?: number;
          };
        }
      ).response?.status;
    }

    return undefined;
  }
}

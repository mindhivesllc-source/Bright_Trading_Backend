import { BadGatewayException, Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { HttpService } from "@nestjs/axios";

export type EasysoftApiResponse = {
  record?: Record<string, unknown>[];
};

@Injectable()
export class EasysoftService {
  private readonly logger = new Logger(EasysoftService.name);

  private readonly apiUrl: string;
  private readonly authorization: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,

    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>("EASYSOFT_API_URL") ||
      "https://brainapis.com/api/bright-dia/ext-client/diamond-list";

    this.authorization =
      this.configService.get<string>("EASYSOFT_AUTHORIZATION") || "";

    this.enabled =
      String(this.configService.get<string>("EASYSOFT_SYNC_ENABLED") ?? "true")
        .trim()
        .toLowerCase() !== "false";
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async getDiamondList(): Promise<Record<string, unknown>[]> {
    if (!this.enabled) {
      return [];
    }

    if (!this.authorization) {
      throw new BadGatewayException(
        "EASYSOFT_AUTHORIZATION is not configured on the server.",
      );
    }

    try {
      const response =
        await this.httpService.axiosRef.post<EasysoftApiResponse>(
          this.apiUrl,
          null,
          {
            headers: {
              Accept: "application/json",
              Authorization: this.authorization,
              "Content-Type": "application/json",
            },

            timeout: 600_000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
        );

      const records = response.data?.record;

      if (!Array.isArray(records)) {
        throw new BadGatewayException(
          "Easysoft returned an invalid inventory response. Expected response.record to be an array.",
        );
      }

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
          data?: unknown;
        };
      };

      const status = axiosError.response?.status;

      const code = axiosError.code;

      this.logger.error(
        `Easysoft request failed | ` +
          `status=${status ?? "none"} | ` +
          `code=${code ?? "none"} | ` +
          `message=${axiosError.message ?? "unknown"} | ` +
          `response=${
            axiosError.response?.data
              ? JSON.stringify(axiosError.response.data).slice(0, 1000)
              : "none"
          }`,
      );

      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
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
        throw new BadGatewayException("Easysoft API rate limit exceeded.");
      }

      if (status === 408 || status === 504) {
        throw new BadGatewayException("Easysoft API request timed out.");
      }

      throw new BadGatewayException(
        `Easysoft inventory download failed${
          status ? ` with HTTP ${status}` : code ? ` with ${code}` : ""
        }.`,
      );
    }
  }

  private getStatus(error: unknown): number | undefined {
    if (error && typeof error === "object" && "response" in error) {
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

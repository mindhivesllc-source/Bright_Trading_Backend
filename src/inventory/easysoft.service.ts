import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  HttpService,
} from '@nestjs/axios';

export type EasysoftApiResponse = {
  record?: Record<string, unknown>[];
};

@Injectable()
export class EasysoftService {
  private readonly logger =
    new Logger(EasysoftService.name);

  private readonly apiUrl: string;
  private readonly authorization: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService:
      HttpService,

    private readonly configService:
      ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>(
        'EASYSOFT_API_URL',
      ) ||
      'https://brainapis.com/api/bright-dia/ext-client/diamond-list';

    this.authorization =
      this.configService.get<string>(
        'EASYSOFT_AUTHORIZATION',
      ) || '';

    this.enabled =
      String(
        this.configService.get<string>(
          'EASYSOFT_SYNC_ENABLED',
        ) ?? 'true',
      )
        .trim()
        .toLowerCase() !== 'false';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async getDiamondList():
    Promise<Record<string, unknown>[]> {
    if (!this.enabled) {
      return [];
    }

    if (!this.authorization) {
      throw new BadGatewayException(
        'EASYSOFT_AUTHORIZATION is not configured on the server.',
      );
    }

    try {
      const response =
        await this.httpService.axiosRef.post<EasysoftApiResponse>(
          this.apiUrl,
          null,
          {
            headers: {
              Accept: 'application/json',
              Authorization:
                this.authorization,
              'Content-Type':
                'application/json',
            },

            timeout: 180_000,
            maxContentLength:
              Infinity,
            maxBodyLength:
              Infinity,
          },
        );

      const records =
        response.data?.record;

      if (!Array.isArray(records)) {
        throw new BadGatewayException(
          'Easysoft returned an invalid inventory response. Expected response.record to be an array.',
        );
      }

      return records;
    } catch (error) {
      if (
        error instanceof
        BadGatewayException
      ) {
        throw error;
      }

      const status =
        this.getStatus(error);

      this.logger.error({
        message:
          'Easysoft inventory request failed.',
        upstreamStatus:
          status,
        errorMessage:
          error instanceof Error
            ? error.message
            : String(error),
      });

      if (
        status === 401 ||
        status === 403
      ) {
        throw new BadGatewayException(
          'Easysoft rejected the configured Authorization key.',
        );
      }

      if (
        status === 408 ||
        status === 504
      ) {
        throw new BadGatewayException(
          'Easysoft inventory request timed out.',
        );
      }

      throw new BadGatewayException(
        'Easysoft inventory could not be downloaded.',
      );
    }
  }

  private getStatus(
    error: unknown,
  ): number | undefined {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error
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
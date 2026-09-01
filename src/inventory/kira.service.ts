// import {
//   BadGatewayException,
//   Injectable,
//   InternalServerErrorException,
//   Logger,
//   UnauthorizedException,
// } from '@nestjs/common';

// import {
//   ConfigService,
// } from '@nestjs/config';

// import {
//   HttpService,
// } from '@nestjs/axios';

// import {
//   Readable,
// } from 'node:stream';

// type KiraTokenPayload = {
//   exp?: number;
// };

// export type AvailableKiraStone = {
//   stoneNo: string;
//   reportNo?: string;
// };

// export type KiraCertificateResponse = {
//   stream: Readable;
//   contentType: string;
// };

// @Injectable()
// export class KiraService {
//   private readonly logger =
//     new Logger(
//       KiraService.name,
//     );

//   private readonly baseUrl:
//     string;

//   private readonly username:
//     string;

//   private readonly password:
//     string;

//   private cachedToken:
//     string | null = null;

//   private tokenExpiresAt = 0;

//   private tokenPromise:
//     Promise<string> | null =
//       null;

//   constructor(
//     private readonly httpService:
//       HttpService,

//     private readonly configService:
//       ConfigService,
//   ) {
//     this.baseUrl = (
//       this.configService.get<string>(
//         'KIRA_API_BASE_URL',
//       ) ||
//       'https://api.kiradiam.com/api/ApiOrder'
//     ).replace(/\/+$/, '');

//     this.username =
//       this.configService.get<string>(
//         'KIRA_USERNAME',
//       ) || '';

//     this.password =
//       this.configService.get<string>(
//         'KIRA_PASSWORD',
//       ) || '';

//     if (
//       !this.username ||
//       !this.password
//     ) {
//       throw new InternalServerErrorException(
//         'KIRA_USERNAME and KIRA_PASSWORD must be configured on the server.',
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * FULL INVENTORY CSV
//    * =====================================================
//    */
//   async downloadFullInventoryCsv():
//     Promise<Readable> {
//     try {
//       return await this.withTokenRetry(
//         async (token) => {
//           const response =
//             await this.httpService
//               .axiosRef
//               .post<Readable>(
//                 `${this.baseUrl}/GetStockDetailForThirdPartyCSV`,
//                 null,
//                 {
//                   params: {
//                     pagestart: 1,
//                     pageend:
//                       800000,
//                   },

//                   headers: {
//                     Accept:
//                       'text/csv, text/plain, */*',

//                     Authorization:
//                       `Bearer ${token}`,
//                   },

//                   responseType:
//                     'stream',

//                   timeout:
//                     180_000,

//                   maxContentLength:
//                     Infinity,

//                   maxBodyLength:
//                     Infinity,
//                 },
//               );

//           return response.data;
//         },
//       );
//     } catch (error) {
//       throw this.toKiraException(
//         error,
//         'Kira CSV inventory could not be downloaded.',
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * CURRENT AVAILABILITY
//    * =====================================================
//    */
//   async getAvailableStockLimited():
//     Promise<
//       AvailableKiraStone[]
//     > {
//     try {
//       return await this.withTokenRetry(
//         async (token) => {
//           const response =
//             await this.httpService
//               .axiosRef
//               .post<
//                 AvailableKiraStone[]
//               >(
//                 `${this.baseUrl}/GetAvailableStockDetailLimited`,
//                 null,
//                 {
//                   headers: {
//                     Accept:
//                       'application/json',

//                     Authorization:
//                       `Bearer ${token}`,
//                   },

//                   timeout:
//                     120_000,
//                 },
//               );

//           return Array.isArray(
//             response.data,
//           )
//             ? response.data
//             : [];
//         },
//       );
//     } catch (error) {
//       throw this.toKiraException(
//         error,
//         'Kira availability list could not be downloaded.',
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * DEBUG INVENTORY PAGE
//    * =====================================================
//    */
//   async getInventoryPage(
//     pageStart: number,
//     pageEnd: number,
//   ): Promise<
//     Record<string, any>
//   > {
//     try {
//       return await this.withTokenRetry(
//         async (token) => {
//           const response =
//             await this.httpService
//               .axiosRef
//               .post(
//                 `${this.baseUrl}/GetStockDetailForThirdParty`,
//                 {},
//                 {
//                   params: {
//                     pagestart:
//                       pageStart,

//                     pageend:
//                       pageEnd,
//                   },

//                   headers: {
//                     Accept:
//                       'application/json',

//                     Authorization:
//                       `Bearer ${token}`,

//                     'Content-Type':
//                       'application/json',
//                   },

//                   timeout:
//                     120_000,

//                   maxContentLength:
//                     Infinity,

//                   maxBodyLength:
//                     Infinity,
//                 },
//               );

//           return response.data;
//         },
//       );
//     } catch (error) {
//       throw this.toKiraException(
//         error,
//         `Could not download Kira records ${pageStart}-${pageEnd}.`,
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * CERTIFICATE PROXY
//    * =====================================================
//    *
//    * IMPORTANT:
//    *
//    * This request happens SERVER-SIDE.
//    *
//    * api.kiradiam.com therefore never needs to
//    * appear in the frontend response or browser URL.
//    */
//   async getCertificateByReportNo(
//     reportNo: string,
//   ): Promise<
//     KiraCertificateResponse
//   > {
//     const safeReportNo =
//       String(
//         reportNo || '',
//       ).trim();

//     if (!safeReportNo) {
//       throw new BadGatewayException(
//         'Certificate report number is required.',
//       );
//     }

//     try {
//       /*
//        * KIRA_API_BASE_URL currently looks like:
//        *
//        * https://api.kiradiam.com/api/ApiOrder
//        *
//        * We only need its origin:
//        *
//        * https://api.kiradiam.com
//        */
//       const kiraOrigin =
//         new URL(
//           this.baseUrl,
//         ).origin;

//       const certificateUrl =
//         `${kiraOrigin}/api/FTP/GetCertificateByReportNo`;

//       const response =
//         await this.httpService
//           .axiosRef
//           .get<Readable>(
//             certificateUrl,
//             {
//               params: {
//                 ReportNo:
//                   safeReportNo,
//               },

//               headers: {
//                 Accept:
//                   'application/pdf, application/octet-stream, */*',
//               },

//               responseType:
//                 'stream',

//               timeout:
//                 120_000,

//               maxContentLength:
//                 Infinity,

//               maxBodyLength:
//                 Infinity,
//             },
//           );

//       const contentType =
//         String(
//           response.headers[
//             'content-type'
//           ] ||
//             'application/pdf',
//         );

//       return {
//         stream:
//           response.data,

//         contentType,
//       };
//     } catch (error) {
//       throw this.toKiraException(
//         error,
//         `Certificate ${safeReportNo} could not be downloaded.`,
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * TOKEN RETRY
//    * =====================================================
//    */
//   private async withTokenRetry<T>(
//     request: (
//       token: string,
//     ) => Promise<T>,
//   ): Promise<T> {
//     let token =
//       await this.getAccessToken();

//     try {
//       return await request(
//         token,
//       );
//     } catch (error) {
//       const status =
//         this.getStatus(
//           error,
//         );

//       if (status !== 401) {
//         throw error;
//       }

//       this.clearCachedToken();

//       token =
//         await this.getAccessToken(
//           true,
//         );

//       return request(token);
//     }
//   }

//   /*
//    * =====================================================
//    * ACCESS TOKEN
//    * =====================================================
//    */
//   private async getAccessToken(
//     forceRefresh = false,
//   ): Promise<string> {
//     const tokenStillValid =
//       this.cachedToken &&
//       Date.now() <
//         this.tokenExpiresAt -
//           60_000;

//     if (
//       !forceRefresh &&
//       tokenStillValid
//     ) {
//       return this.cachedToken as string;
//     }

//     if (
//       !forceRefresh &&
//       this.tokenPromise
//     ) {
//       return this.tokenPromise;
//     }

//     this.tokenPromise =
//       this.loginToKira();

//     try {
//       return await this
//         .tokenPromise;
//     } finally {
//       this.tokenPromise =
//         null;
//     }
//   }

//   /*
//    * =====================================================
//    * LOGIN
//    * =====================================================
//    */
//   private async loginToKira():
//     Promise<string> {
//     try {
//       const response =
//         await this.httpService
//           .axiosRef
//           .post(
//             `${this.baseUrl}/VerifyUser`,
//             null,
//             {
//               params: {
//                 username:
//                   this.username,

//                 password:
//                   this.password,
//               },

//               headers: {
//                 Accept:
//                   'application/json',

//                 'Content-Type':
//                   'application/json',
//               },

//               timeout:
//                 30_000,
//             },
//           );

//       const token =
//         this.extractToken(
//           response.data,
//         );

//       if (!token) {
//         throw new BadGatewayException(
//           'Kira VerifyUser returned no usable token.',
//         );
//       }

//       this.cachedToken =
//         token;

//       this.tokenExpiresAt =
//         this.readTokenExpiry(
//           token,
//         ) ||
//         Date.now() +
//           10 *
//             60 *
//             1000;

//       return token;
//     } catch (error) {
//       if (
//         error instanceof
//         BadGatewayException
//       ) {
//         throw error;
//       }

//       const status =
//         this.getStatus(
//           error,
//         );

//       if (
//         status === 401 ||
//         status === 403
//       ) {
//         throw new UnauthorizedException(
//           'The configured Kira supplier credentials were rejected.',
//         );
//       }

//       throw this.toKiraException(
//         error,
//         'Unable to create a Kira supplier session.',
//       );
//     }
//   }

//   /*
//    * =====================================================
//    * TOKEN EXTRACTION
//    * =====================================================
//    */
//   private extractToken(
//     data: unknown,
//   ): string | null {
//     if (
//       typeof data ===
//       'string'
//     ) {
//       return this.cleanToken(
//         data,
//       );
//     }

//     if (
//       !data ||
//       typeof data !==
//         'object'
//     ) {
//       return null;
//     }

//     const source =
//       data as Record<
//         string,
//         unknown
//       >;

//     const candidates = [
//       source.accessToken,
//       source.AccessToken,
//       source.token,
//       source.Token,
//       source.jwt,
//       source.JWT,
//       source.authToken,
//       source.AuthToken,
//     ];

//     if (
//       source.data &&
//       typeof source.data ===
//         'object'
//     ) {
//       const nested =
//         source.data as Record<
//           string,
//           unknown
//         >;

//       candidates.push(
//         nested.accessToken,
//         nested.AccessToken,
//         nested.token,
//         nested.Token,
//         nested.jwt,
//         nested.JWT,
//       );
//     }

//     for (
//       const candidate
//       of candidates
//     ) {
//       if (
//         typeof candidate ===
//         'string'
//       ) {
//         const token =
//           this.cleanToken(
//             candidate,
//           );

//         if (token) {
//           return token;
//         }
//       }
//     }

//     return null;
//   }

//   /*
//    * =====================================================
//    * TOKEN CLEANUP
//    * =====================================================
//    */
//   private cleanToken(
//     value: string,
//   ): string | null {
//     const cleaned =
//       value
//         .trim()
//         .replace(
//           /^"|"$/g,
//           '',
//         )
//         .replace(
//           /^Bearer\s+/i,
//           '',
//         );

//     return cleaned
//       .split('.')
//       .length === 3
//       ? cleaned
//       : null;
//   }

//   /*
//    * =====================================================
//    * READ JWT EXPIRY
//    * =====================================================
//    */
//   private readTokenExpiry(
//     token: string,
//   ): number | null {
//     try {
//       const payloadSegment =
//         token.split('.')[1];

//       const normalized =
//         payloadSegment
//           .replace(
//             /-/g,
//             '+',
//           )
//           .replace(
//             /_/g,
//             '/',
//           );

//       const padded =
//         normalized +
//         '='.repeat(
//           (
//             4 -
//             (normalized.length %
//               4)
//           ) %
//             4,
//         );

//       const payload =
//         JSON.parse(
//           Buffer.from(
//             padded,
//             'base64',
//           ).toString(
//             'utf8',
//           ),
//         ) as KiraTokenPayload;

//       return payload.exp
//         ? payload.exp *
//             1000
//         : null;
//     } catch {
//       return null;
//     }
//   }

//   /*
//    * =====================================================
//    * CLEAR TOKEN
//    * =====================================================
//    */
//   private clearCachedToken():
//     void {
//     this.cachedToken =
//       null;

//     this.tokenExpiresAt =
//       0;
//   }

//   /*
//    * =====================================================
//    * ERROR STATUS
//    * =====================================================
//    */
//   private getStatus(
//     error: unknown,
//   ): number | undefined {
//     if (
//       error &&
//       typeof error ===
//         'object' &&
//       'response' in error
//     ) {
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

//   /*
//    * =====================================================
//    * ERROR CODE
//    * =====================================================
//    */
//   private getErrorCode(
//     error: unknown,
//   ): string | undefined {
//     if (
//       error &&
//       typeof error ===
//         'object' &&
//       'code' in error
//     ) {
//       return String(
//         (
//           error as {
//             code?: unknown;
//           }
//         ).code || '',
//       );
//     }

//     return undefined;
//   }

//   /*
//    * =====================================================
//    * ERROR CONVERSION
//    * =====================================================
//    */
//   private toKiraException(
//     error: unknown,
//     fallbackMessage: string,
//   ) {
//     const status =
//       this.getStatus(
//         error,
//       );

//     const code =
//       this.getErrorCode(
//         error,
//       );

//     this.logger.error({
//       message:
//         fallbackMessage,

//       upstreamStatus:
//         status,

//       errorCode:
//         code,

//       errorMessage:
//         error instanceof Error
//           ? error.message
//           : String(error),
//     });

//     if (
//       status === 401 ||
//       status === 403
//     ) {
//       return new BadGatewayException(
//         'Kira rejected the supplier session.',
//       );
//     }

//     if (
//       status === 408 ||
//       status === 504 ||
//       code ===
//         'ECONNABORTED' ||
//       code ===
//         'ETIMEDOUT'
//     ) {
//       return new BadGatewayException(
//         'Kira request timed out.',
//       );
//     }

//     return new BadGatewayException(
//       fallbackMessage,
//     );
//   }
// }




import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Readable } from 'node:stream';

type KiraTokenPayload = {
  exp?: number;
};

export type AvailableKiraStone = {
  stoneNo: string;
  reportNo?: string;
};

export type KiraCertificateResponse = {
  stream: Readable;
  contentType: string;
};

@Injectable()
export class KiraService {
  private readonly logger = new Logger(KiraService.name);

  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('KIRA_API_BASE_URL') ||
      'https://api.kiradiam.com/api/ApiOrder'
    ).replace(/\/+$/, '');

    this.username =
      this.configService.get<string>('KIRA_USERNAME') || '';

    this.password =
      this.configService.get<string>('KIRA_PASSWORD') || '';

    if (!this.username || !this.password) {
      throw new InternalServerErrorException(
        'KIRA_USERNAME and KIRA_PASSWORD must be configured on the server.',
      );
    }
  }

  /*
   * =====================================================
   * FULL INVENTORY CSV
   * =====================================================
   */
  async downloadFullInventoryCsv(): Promise<Readable> {
    try {
      return await this.withTokenRetry(async (token) => {
        const response = await this.httpService.axiosRef.post<Readable>(
          `${this.baseUrl}/GetStockDetailForThirdPartyCSV`,
          null,
          {
            params: {
              pagestart: 1,
              pageend: 800000,
            },

            headers: {
              Accept: 'text/csv, text/plain, */*',
              Authorization: `Bearer ${token}`,
            },

            responseType: 'stream',

            /*
             * Full exports can be much larger than normal inventory requests.
             * This only affects the export request.
             */
            timeout: 600_000,

            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
        );

        return response.data;
      });
    } catch (error) {
      throw this.toKiraException(
        error,
        'Kira CSV inventory could not be downloaded.',
      );
    }
  }

  /*
   * =====================================================
   * CURRENT AVAILABILITY
   * =====================================================
   */
  async getAvailableStockLimited(): Promise<AvailableKiraStone[]> {
    try {
      return await this.withTokenRetry(async (token) => {
        const response = await this.httpService.axiosRef.post<
          AvailableKiraStone[]
        >(
          `${this.baseUrl}/GetAvailableStockDetailLimited`,
          null,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },

            timeout: 120_000,
          },
        );

        return Array.isArray(response.data) ? response.data : [];
      });
    } catch (error) {
      throw this.toKiraException(
        error,
        'Kira availability list could not be downloaded.',
      );
    }
  }

  /*
   * =====================================================
   * DEBUG INVENTORY PAGE
   * =====================================================
   */
  async getInventoryPage(
    pageStart: number,
    pageEnd: number,
  ): Promise<Record<string, any>> {
    try {
      return await this.withTokenRetry(async (token) => {
        const response = await this.httpService.axiosRef.post(
          `${this.baseUrl}/GetStockDetailForThirdParty`,
          {},
          {
            params: {
              pagestart: pageStart,
              pageend: pageEnd,
            },

            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },

            timeout: 120_000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
        );

        return response.data;
      });
    } catch (error) {
      throw this.toKiraException(
        error,
        `Could not download Kira records ${pageStart}-${pageEnd}.`,
      );
    }
  }

  /*
   * =====================================================
   * CERTIFICATE PROXY
   * =====================================================
   */
  async getCertificateByReportNo(
    reportNo: string,
  ): Promise<KiraCertificateResponse> {
    const safeReportNo = String(reportNo || '').trim();

    if (!safeReportNo) {
      throw new BadGatewayException(
        'Certificate report number is required.',
      );
    }

    try {
      const kiraOrigin = new URL(this.baseUrl).origin;

      const certificateUrl =
        `${kiraOrigin}/api/FTP/GetCertificateByReportNo`;

      const response = await this.httpService.axiosRef.get<Readable>(
        certificateUrl,
        {
          params: {
            ReportNo: safeReportNo,
          },

          headers: {
            Accept:
              'application/pdf, application/octet-stream, */*',
          },

          responseType: 'stream',
          timeout: 120_000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const contentType = String(
        response.headers['content-type'] || 'application/pdf',
      );

      return {
        stream: response.data,
        contentType,
      };
    } catch (error) {
      throw this.toKiraException(
        error,
        `Certificate ${safeReportNo} could not be downloaded.`,
      );
    }
  }

  /*
   * =====================================================
   * TOKEN RETRY
   * =====================================================
   */
  private async withTokenRetry<T>(
    request: (token: string) => Promise<T>,
  ): Promise<T> {
    let token = await this.getAccessToken();

    try {
      return await request(token);
    } catch (error) {
      const status = this.getStatus(error);

      if (status !== 401) {
        throw error;
      }

      this.clearCachedToken();

      token = await this.getAccessToken(true);

      return request(token);
    }
  }

  /*
   * =====================================================
   * ACCESS TOKEN
   * =====================================================
   */
  private async getAccessToken(
    forceRefresh = false,
  ): Promise<string> {
    const tokenStillValid =
      this.cachedToken &&
      Date.now() < this.tokenExpiresAt - 60_000;

    if (!forceRefresh && tokenStillValid) {
      return this.cachedToken as string;
    }

    if (!forceRefresh && this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.loginToKira();

    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */
  private async loginToKira(): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.baseUrl}/VerifyUser`,
        null,
        {
          params: {
            username: this.username,
            password: this.password,
          },

          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },

          timeout: 30_000,
        },
      );

      const token = this.extractToken(response.data);

      if (!token) {
        throw new BadGatewayException(
          'Kira VerifyUser returned no usable token.',
        );
      }

      this.cachedToken = token;

      this.tokenExpiresAt =
        this.readTokenExpiry(token) ||
        Date.now() + 10 * 60 * 1000;

      return token;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const status = this.getStatus(error);

      if (status === 401 || status === 403) {
        throw new UnauthorizedException(
          'The configured Kira supplier credentials were rejected.',
        );
      }

      throw this.toKiraException(
        error,
        'Unable to create a Kira supplier session.',
      );
    }
  }

  /*
   * =====================================================
   * TOKEN EXTRACTION
   * =====================================================
   */
  private extractToken(data: unknown): string | null {
    if (typeof data === 'string') {
      return this.cleanToken(data);
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    const source = data as Record<string, unknown>;

    const candidates = [
      source.accessToken,
      source.AccessToken,
      source.token,
      source.Token,
      source.jwt,
      source.JWT,
      source.authToken,
      source.AuthToken,
    ];

    if (source.data && typeof source.data === 'object') {
      const nested = source.data as Record<string, unknown>;

      candidates.push(
        nested.accessToken,
        nested.AccessToken,
        nested.token,
        nested.Token,
        nested.jwt,
        nested.JWT,
      );
    }

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const token = this.cleanToken(candidate);

        if (token) {
          return token;
        }
      }
    }

    return null;
  }

  /*
   * =====================================================
   * TOKEN CLEANUP
   * =====================================================
   */
  private cleanToken(value: string): string | null {
    const cleaned = value
      .trim()
      .replace(/^"|"$/g, '')
      .replace(/^Bearer\s+/i, '');

    return cleaned.split('.').length === 3 ? cleaned : null;
  }

  /*
   * =====================================================
   * READ JWT EXPIRY
   * =====================================================
   */
  private readTokenExpiry(token: string): number | null {
    try {
      const payloadSegment = token.split('.')[1];

      const normalized = payloadSegment
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded =
        normalized +
        '='.repeat((4 - (normalized.length % 4)) % 4);

      const payload = JSON.parse(
        Buffer.from(padded, 'base64').toString('utf8'),
      ) as KiraTokenPayload;

      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /*
   * =====================================================
   * CLEAR TOKEN
   * =====================================================
   */
  private clearCachedToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /*
   * =====================================================
   * ERROR STATUS
   * =====================================================
   */
  private getStatus(error: unknown): number | undefined {
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

  /*
   * =====================================================
   * ERROR CODE
   * =====================================================
   */
  private getErrorCode(error: unknown): string | undefined {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error
    ) {
      return String(
        (error as { code?: unknown }).code || '',
      );
    }

    return undefined;
  }

  /*
   * =====================================================
   * ERROR CONVERSION
   * =====================================================
   */
  private toKiraException(
    error: unknown,
    fallbackMessage: string,
  ) {
    const status = this.getStatus(error);
    const code = this.getErrorCode(error);

    this.logger.error({
      message: fallbackMessage,
      upstreamStatus: status,
      errorCode: code,
      errorMessage:
        error instanceof Error
          ? error.message
          : String(error),
    });

    if (status === 401 || status === 403) {
      return new BadGatewayException(
        'Kira rejected the supplier session.',
      );
    }

    if (
      status === 408 ||
      status === 504 ||
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT'
    ) {
      return new BadGatewayException(
        'Kira request timed out.',
      );
    }

    return new BadGatewayException(fallbackMessage);
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { PostHogService } from './posthog.service';

@Catch()
export class PostHogExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly postHogService: PostHogService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (
      status >= HttpStatus.INTERNAL_SERVER_ERROR &&
      exception instanceof Error
    ) {
      this.postHogService.client?.captureException(
        exception,
      );
    }

    const responseBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            message: 'Internal server error',
          };

    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();

    httpAdapter.reply(
      context.getResponse(),
      responseBody,
      status,
    );
  }
}

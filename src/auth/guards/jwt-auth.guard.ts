import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token is missing.',
      );
    }

    const secret = this.configService.getOrThrow<string>(
      'JWT_SECRET',
    );

    const issuer = this.configService.get<string>(
      'JWT_ISSUER',
    );

    const audience = this.configService.get<string>(
      'JWT_AUDIENCE',
    );

    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret,

        ...(issuer
          ? {
              issuer,
            }
          : {}),

        ...(audience
          ? {
              audience,
            }
          : {}),
      });

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Authentication token is invalid or expired.',
      );
    }
  }

  private extractBearerToken(
    request: Request,
  ): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.trim().split(/\s+/);

    if (
      type?.toLowerCase() !== 'bearer' ||
      !token
    ) {
      return undefined;
    }

    return token;
  }
}

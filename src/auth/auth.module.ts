import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { env } from '../config/env.config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: env.jwtExpiresIn,
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      },
      verifyOptions: {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

// import {
//   Body,
//   Controller,
//   Get,
//   HttpCode,
//   HttpStatus,
//   Post,
//   Req,
//   UnauthorizedException,
//   UseGuards,
// } from '@nestjs/common';
// import { Throttle } from '@nestjs/throttler';

// import { AuthService } from './auth.service';
// import { LoginDto } from './dto/login.dto';
// import { SignupDto } from './dto/signup.dto';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';
// import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @Post('signup')
//   @HttpCode(HttpStatus.CREATED)
//   @Throttle({ default: { limit: 5, ttl: 60_000 } })
//   signup(@Body() dto: SignupDto) {
//     return this.authService.signup(dto);
//   }

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @Throttle({ default: { limit: 5, ttl: 60_000 } })
//   login(@Body() dto: LoginDto) {
//     return this.authService.login(dto);
//   }

//   @Get('me')
//   @UseGuards(JwtAuthGuard)
//   me(@Req() request: AuthenticatedRequest) {
//     if (!request.user) {
//       throw new UnauthorizedException('Authentication required.');
//     }

//     return this.authService.getCurrentUser(request.user.sub);
//   }
// }





// import {
//   Body,
//   Controller,
//   Get,
//   HttpCode,
//   HttpStatus,
//   Post,
//   Req,
//   UnauthorizedException,
//   UseGuards,
// } from '@nestjs/common';

// import {
//   Throttle,
// } from '@nestjs/throttler';

// import {
//   AuthService,
// } from './auth.service';

// import {
//   LoginDto,
// } from './dto/login.dto';

// import {
//   SignupDto,
// } from './dto/signup.dto';

// import {
//   JwtAuthGuard,
// } from './guards/jwt-auth.guard';

// import type {
//   AuthenticatedRequest,
// } from './interfaces/authenticated-request.interface';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     private readonly authService:
//       AuthService,
//   ) {}

//   @Post('signup')
//   @HttpCode(HttpStatus.CREATED)
//   @Throttle({
//     default: {
//       limit: 5,
//       ttl: 60_000,
//     },
//   })
//   signup(
//     @Body()
//     dto: SignupDto,
//   ) {
//     return this.authService
//       .signup(dto);
//   }

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @Throttle({
//     default: {
//       limit: 5,
//       ttl: 60_000,
//     },
//   })
//   login(
//     @Body()
//     dto: LoginDto,
//   ) {
//     return this.authService
//       .login(dto);
//   }

//   @Post('forgot-password')
//   @HttpCode(HttpStatus.OK)
//   @Throttle({
//     default: {
//       limit: 5,
//       ttl: 60_000,
//     },
//   })
//   forgotPassword(
//     @Body()
//     dto: {
//       email?: string;
//       newPassword?: string;
//       confirmPassword?: string;
//     },
//   ) {
//     return this.authService
//       .resetPasswordWithoutEmail(dto);
//   }

//   @Get('me')
//   @UseGuards(JwtAuthGuard)
//   me(
//     @Req()
//     request: AuthenticatedRequest,
//   ) {
//     if (!request.user) {
//       throw new UnauthorizedException(
//         'Authentication required.',
//       );
//     }

//     return this.authService
//       .getCurrentUser(
//         request.user.sub,
//       );
//   }
// }






import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

import type {
  AuthenticatedRequest,
} from './interfaces/authenticated-request.interface';
import type { RefreshClientInfo } from './refresh-tokens.service';

// Device details stored with a refresh token so sessions can be told apart.
function clientInfo(request: Request): RefreshClientInfo {
  const platform = request.headers['x-app-platform'];

  return {
    userAgent: request.headers['user-agent'],
    platform: typeof platform === 'string' ? platform : undefined,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
  ) {
    return this.authService.signup(dto, clientInfo(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ) {
    return this.authService.login(dto, clientInfo(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
    },
  })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
      clientInfo(request),
    );
  }

  // Always 204, even for unknown or malformed tokens, so the app can
  // call it fire-and-forget on sign out.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
    },
  })
  async logout(
    @Body() dto: {
      refreshToken?: unknown;
    },
  ): Promise<void> {
    await this.authService.logout(dto?.refreshToken);
  }

  // Step 1: Request email OTP
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  forgotPassword(
    @Body() dto: {
      email?: string;
    },
  ) {
    return this.authService.forgotPassword(dto);
  }

  // Step 2: Verify received OTP
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  verifyResetOtp(
    @Body() dto: {
      email?: string;
      otp?: string;
    },
  ) {
    return this.authService.verifyResetOtp(dto);
  }

  // Step 3: Change password after verification
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  resetPassword(
    @Body() dto: {
      resetToken?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication required.',
      );
    }

    return this.authService.getCurrentUser(
      request.user.sub,
    );
  }

  // Account deletion from the mobile app. Removes the user and
  // their cart, devices, saved stones and saved searches.
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication required.',
      );
    }

    await this.authService.deleteAccount(
      request.user.sub,
    );
  }
}

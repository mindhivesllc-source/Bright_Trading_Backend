// import {
//   ConflictException,
//   Injectable,
//   InternalServerErrorException,
//   UnauthorizedException,
// } from '@nestjs/common';

// import { JwtService } from '@nestjs/jwt';

// import {
//   hashPassword,
//   verifyPassword,
// } from '../common/utils/password.util';

// import { env } from '../config/env.config';

// import {
//   UserDocument,
// } from '../users/schemas/user.schema';

// import { UsersService } from '../users/users.service';

// import { LoginDto } from './dto/login.dto';
// import { SignupDto } from './dto/signup.dto';

// import {
//   JwtPayload,
// } from './interfaces/jwt-payload.interface';

// import {
//   PublicUser,
// } from './interfaces/public-user.interface';

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly usersService: UsersService,
//     private readonly jwtService: JwtService,
//   ) {}

//   async signup(
//     signupDto: SignupDto,
//   ) {
//     const email =
//       signupDto.email
//         .trim()
//         .toLowerCase();

//     const existingUser =
//       await this.usersService.findByEmail(
//         email,
//       );

//     if (existingUser) {
//       throw new ConflictException(
//         'An account with this email already exists.',
//       );
//     }

//     const firstName =
//       signupDto.firstName.trim();

//     const lastName =
//       signupDto.lastName.trim();

//     const name =
//       `${firstName} ${lastName}`.trim();

//     /*
//      * Use your existing password utility.
//      * Do not use bcrypt directly here.
//      */
//     const passwordHash =
//       await hashPassword(
//         signupDto.password,
//       );

//     try {
//       const user =
//         await this.usersService.create({
//           name,
//           firstName,
//           lastName,
//           email,
//           passwordHash,

//           companyName:
//             signupDto.companyName.trim(),

//           salesPerson:
//             signupDto.salesPerson.trim(),

//           mobileNumber:
//             signupDto.mobileNumber.trim(),

//           address:
//             signupDto.address?.trim() || '',

//           state:
//             signupDto.state?.trim() || '',

//           city:
//             signupDto.city?.trim() || '',

//           zipCode:
//             signupDto.zipCode?.trim() || '',
//         });

//       return this.createAuthResponse(
//         user,
//       );
//     } catch (error) {
//       if (
//         this.isMongoDuplicateKeyError(
//           error,
//         )
//       ) {
//         throw new ConflictException(
//           'An account with this email already exists.',
//         );
//       }

//       console.error(
//         'Unable to create user:',
//         error,
//       );

//       throw new InternalServerErrorException(
//         'Unable to create the account.',
//       );
//     }
//   }

//   async login(
//     dto: LoginDto,
//   ) {
//     const email =
//       dto.email
//         .trim()
//         .toLowerCase();

//     const user =
//       await this.usersService
//         .findByEmailWithPassword(
//           email,
//         );

//     if (!user) {
//       throw new UnauthorizedException(
//         'Invalid email or password.',
//       );
//     }

//     const passwordIsValid =
//       await verifyPassword(
//         dto.password,
//         user.passwordHash,
//       );

//     if (!passwordIsValid) {
//       throw new UnauthorizedException(
//         'Invalid email or password.',
//       );
//     }

//     return this.createAuthResponse(
//       user,
//     );
//   }

//   async getCurrentUser(
//     userId: string,
//   ): Promise<{
//     user: PublicUser;
//   }> {
//     const user =
//       await this.usersService.findById(
//         userId,
//       );

//     if (!user) {
//       throw new UnauthorizedException(
//         'User no longer exists.',
//       );
//     }

//     return {
//       user: this.toPublicUser(
//         user,
//       ),
//     };
//   }

//   private async createAuthResponse(
//     user: UserDocument,
//   ) {
//     const payload: JwtPayload = {
//       sub: user._id.toString(),
//       email: user.email,
//     };

//     const accessToken =
//       await this.jwtService.signAsync(
//         payload,
//       );

//     return {
//       message:
//         'Authentication successful.',

//       user:
//         this.toPublicUser(user),

//       accessToken,

//       tokenType: 'Bearer',

//       expiresIn:
//         env.jwtExpiresIn,
//     };
//   }

//   private toPublicUser(
//     user: UserDocument,
//   ): PublicUser {
//     return {
//       id: user._id.toString(),

//       name: user.name,

//       firstName:
//         user.firstName,

//       lastName:
//         user.lastName,

//       email:
//         user.email,

//       companyName:
//         user.companyName,

//       salesPerson:
//         user.salesPerson,

//       mobileNumber:
//         user.mobileNumber,

//       address:
//         user.address || '',

//       state:
//         user.state || '',

//       city:
//         user.city || '',

//       zipCode:
//         user.zipCode || '',

//       createdAt:
//         user.createdAt,

//       updatedAt:
//         user.updatedAt,
//     };
//   }

//   private isMongoDuplicateKeyError(
//     error: unknown,
//   ): boolean {
//     return (
//       typeof error === 'object' &&
//       error !== null &&
//       'code' in error &&
//       (
//         error as {
//           code?: number;
//         }
//       ).code === 11000
//     );
//   }
// }




// import {
//   BadRequestException,
//   ConflictException,
//   Injectable,
//   InternalServerErrorException,
//   UnauthorizedException,
// } from '@nestjs/common';

// import {
//   JwtService,
// } from '@nestjs/jwt';

// import {
//   hashPassword,
//   verifyPassword,
// } from '../common/utils/password.util';

// import {
//   env,
// } from '../config/env.config';

// import {
//   UserDocument,
// } from '../users/schemas/user.schema';

// import {
//   UsersService,
// } from '../users/users.service';

// import {
//   LoginDto,
// } from './dto/login.dto';

// import {
//   SignupDto,
// } from './dto/signup.dto';

// import {
//   JwtPayload,
// } from './interfaces/jwt-payload.interface';

// import {
//   PublicUser,
// } from './interfaces/public-user.interface';

// type ResetPasswordDto = {
//   email?: string;
//   newPassword?: string;
//   confirmPassword?: string;
// };

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly usersService:
//       UsersService,

//     private readonly jwtService:
//       JwtService,
//   ) {}

//   async signup(
//     signupDto: SignupDto,
//   ) {
//     const email =
//       signupDto.email
//         .trim()
//         .toLowerCase();

//     const existingUser =
//       await this.usersService
//         .findByEmail(email);

//     if (existingUser) {
//       throw new ConflictException(
//         'An account with this email already exists.',
//       );
//     }

//     const firstName =
//       signupDto.firstName.trim();

//     const lastName =
//       signupDto.lastName.trim();

//     const name =
//       `${firstName} ${lastName}`.trim();

//     const passwordHash =
//       await hashPassword(
//         signupDto.password,
//       );

//     try {
//       const user =
//         await this.usersService.create({
//           name,
//           firstName,
//           lastName,
//           email,
//           passwordHash,

//           companyName:
//             signupDto.companyName.trim(),

//           salesPerson:
//             signupDto.salesPerson.trim(),

//           mobileNumber:
//             signupDto.mobileNumber.trim(),

//           address:
//             signupDto.address?.trim() || '',

//           state:
//             signupDto.state?.trim() || '',

//           city:
//             signupDto.city?.trim() || '',

//           zipCode:
//             signupDto.zipCode?.trim() || '',
//         });

//       return this.createAuthResponse(
//         user,
//       );
//     } catch (error) {
//       if (
//         this.isMongoDuplicateKeyError(
//           error,
//         )
//       ) {
//         throw new ConflictException(
//           'An account with this email already exists.',
//         );
//       }

//       console.error(
//         'Unable to create user:',
//         error,
//       );

//       throw new InternalServerErrorException(
//         'Unable to create the account.',
//       );
//     }
//   }

//   async login(
//     dto: LoginDto,
//   ) {
//     const email =
//       dto.email
//         .trim()
//         .toLowerCase();

//     const user =
//       await this.usersService
//         .findByEmailWithPassword(
//           email,
//         );

//     if (!user) {
//       throw new UnauthorizedException(
//         'Invalid email or password.',
//       );
//     }

//     const passwordIsValid =
//       await verifyPassword(
//         dto.password,
//         user.passwordHash,
//       );

//     if (!passwordIsValid) {
//       throw new UnauthorizedException(
//         'Invalid email or password.',
//       );
//     }

//     return this.createAuthResponse(
//       user,
//     );
//   }

//   async resetPasswordWithoutEmail(
//     dto: ResetPasswordDto,
//   ) {
//     const email =
//       String(dto.email || '')
//         .trim()
//         .toLowerCase();

//     const newPassword =
//       String(dto.newPassword || '');

//     const confirmPassword =
//       String(dto.confirmPassword || '');

//     if (!email) {
//       throw new BadRequestException(
//         'Email address is required.',
//       );
//     }

//     if (
//       newPassword.length < 8 ||
//       newPassword.length > 128
//     ) {
//       throw new BadRequestException(
//         'Password must be between 8 and 128 characters.',
//       );
//     }

//     if (
//       !/[A-Za-z]/.test(newPassword) ||
//       !/\d/.test(newPassword)
//     ) {
//       throw new BadRequestException(
//         'Password must contain at least one letter and one number.',
//       );
//     }

//     if (
//       newPassword !==
//       confirmPassword
//     ) {
//       throw new BadRequestException(
//         'Passwords do not match.',
//       );
//     }

//     const existingUser =
//       await this.usersService
//         .findByEmail(email);

//     if (!existingUser) {
//       throw new BadRequestException(
//         'No account found with this email address.',
//       );
//     }

//     const passwordHash =
//       await hashPassword(
//         newPassword,
//       );

//     const updated =
//       await this.usersService
//         .updatePasswordByEmail(
//           email,
//           passwordHash,
//         );

//     if (!updated) {
//       throw new InternalServerErrorException(
//         'Unable to reset password. Please try again.',
//       );
//     }

//     return {
//       message:
//         'Password reset successfully. Please login with your new password.',
//     };
//   }

//   async getCurrentUser(
//     userId: string,
//   ): Promise<{
//     user: PublicUser;
//   }> {
//     const user =
//       await this.usersService
//         .findById(userId);

//     if (!user) {
//       throw new UnauthorizedException(
//         'User no longer exists.',
//       );
//     }

//     return {
//       user:
//         this.toPublicUser(
//           user,
//         ),
//     };
//   }

//   private async createAuthResponse(
//     user: UserDocument,
//   ) {
//     const payload: JwtPayload = {
//       sub:
//         user._id.toString(),

//       email:
//         user.email,
//     };

//     const accessToken =
//       await this.jwtService
//         .signAsync(payload);

//     return {
//       message:
//         'Authentication successful.',

//       user:
//         this.toPublicUser(
//           user,
//         ),

//       accessToken,

//       tokenType:
//         'Bearer',

//       expiresIn:
//         env.jwtExpiresIn,
//     };
//   }

//   private toPublicUser(
//     user: UserDocument,
//   ): PublicUser {
//     return {
//       id:
//         user._id.toString(),

//       name:
//         user.name,

//       firstName:
//         user.firstName,

//       lastName:
//         user.lastName,

//       email:
//         user.email,

//       companyName:
//         user.companyName,

//       salesPerson:
//         user.salesPerson,

//       mobileNumber:
//         user.mobileNumber,

//       address:
//         user.address || '',

//       state:
//         user.state || '',

//       city:
//         user.city || '',

//       zipCode:
//         user.zipCode || '',

//       createdAt:
//         user.createdAt,

//       updatedAt:
//         user.updatedAt,
//     };
//   }

//   private isMongoDuplicateKeyError(
//     error: unknown,
//   ): boolean {
//     return (
//       typeof error === 'object' &&
//       error !== null &&
//       'code' in error &&
//       (
//         error as {
//           code?: number;
//         }
//       ).code === 11000
//     );
//   }
// }






import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import {
  createHmac,
  randomBytes,
  randomInt,
} from 'crypto';

import * as nodemailer from 'nodemailer';

import {
  hashPassword,
  verifyPassword,
} from '../common/utils/password.util';

import { env } from '../config/env.config';

import {
  PostHogService,
} from '../posthog/posthog.service';

import {
  UserDocument,
} from '../users/schemas/user.schema';

import { CartService } from '../cart/cart.service';
import { DevicesService } from '../devices/devices.service';
import { SavedService } from '../saved/saved.service';
import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import {
  RefreshClientInfo,
  RefreshTokensService,
} from './refresh-tokens.service';

import {
  JwtPayload,
} from './interfaces/jwt-payload.interface';

import {
  PublicUser,
} from './interfaces/public-user.interface';

type ForgotPasswordDto = {
  email?: string;
};

type VerifyResetOtpDto = {
  email?: string;
  otp?: string;
};

type ResetPasswordDto = {
  resetToken?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cartService: CartService,
    private readonly devicesService: DevicesService,
    private readonly savedService: SavedService,
    private readonly postHogService: PostHogService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  // Existing signup functionality
  async signup(
    signupDto: SignupDto,
    client: RefreshClientInfo = {},
  ) {
    const email = signupDto.email
      .trim()
      .toLowerCase();

    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const firstName = signupDto.firstName.trim();
    const lastName = signupDto.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();

    const passwordHash = await hashPassword(
      signupDto.password,
    );

    try {
      const user = await this.usersService.create({
        name,
        firstName,
        lastName,
        email,
        passwordHash,
        companyName: signupDto.companyName.trim(),
        salesPerson: signupDto.salesPerson.trim(),
        mobileNumber: signupDto.mobileNumber.trim(),
        address: signupDto.address?.trim() || '',
        state: signupDto.state?.trim() || '',
        city: signupDto.city?.trim() || '',
        zipCode: signupDto.zipCode?.trim() || '',
      });

      const response = await this.createAuthResponse(user, client);

      this.postHogService.client?.capture({
        distinctId: user._id.toString(),
        event: 'account_created',
      });

      return response;
    } catch (error) {
      if (this.isMongoDuplicateKeyError(error)) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      console.error('Unable to create user:', error);

      throw new InternalServerErrorException(
        'Unable to create the account.',
      );
    }
  }

  // Existing login functionality
  async login(
    dto: LoginDto,
    client: RefreshClientInfo = {},
  ) {
    const email = dto.email
      .trim()
      .toLowerCase();

    const user =
      await this.usersService.findByEmailWithPassword(
        email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordIsValid = await verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const response = await this.createAuthResponse(user, client);

    this.postHogService.client?.capture({
      distinctId: user._id.toString(),
      event: 'user_logged_in',
    });

    return response;
  }

  // STEP 1: Generate and email OTP
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = String(dto?.email || '')
      .trim()
      .toLowerCase();

    if (!this.isValidEmail(email)) {
      throw new BadRequestException(
        'Please enter a valid email address.',
      );
    }

    const response = {
      message:
        'If an account exists with this email, a verification code will be sent.',
    };

    const user = await this.usersService.findByEmail(
      email,
    );

    // Prevent account enumeration.
    if (!user) {
      return response;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      console.error('SMTP credentials are not configured.');

      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }

    const otp = randomInt(
      0,
      1_000_000,
    ).toString().padStart(6, '0');

    const otpHash = this.hashResetValue(
      'otp',
      `${email}:${otp}`,
    );

    const now = Date.now();

    const saved = await this.usersService
      .beginPasswordReset(
        email,
        otpHash,
        new Date(now + OTP_EXPIRY_MS),
        new Date(now - OTP_COOLDOWN_MS),
      );

    // Return a generic response during the cooldown.
    if (!saved) {
      return response;
    }

    try {
      const port = Number(
        process.env.SMTP_PORT || 465,
      );

      const transporter =
        nodemailer.createTransport({
          host:
            process.env.SMTP_HOST ||
            'smtp.gmail.com',
          port,
          secure:
            process.env.SMTP_SECURE !== undefined
              ? process.env.SMTP_SECURE === 'true'
              : port === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        });

      const safeFrom =
        process.env.SMTP_FROM || smtpUser;

      await transporter.sendMail({
        from: safeFrom,
        to: email,
        subject: 'Your Password Reset Verification Code',
        text:
          `Your password reset code is ${otp}.\n\n` +
          'This code expires in 5 minutes.\n\n' +
          'If you did not request this, ignore this email.',
      });

      return response;
    } catch (error) {
      console.error('Unable to send password reset email:', error);

      await this.usersService
        .cancelPasswordReset(email, otpHash);

      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  // STEP 2: Verify OTP
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const email = String(dto?.email || '')
      .trim()
      .toLowerCase();

    const otp = String(dto?.otp || '').trim();

    if (
      !this.isValidEmail(email) ||
      !/^\d{6}$/.test(otp)
    ) {
      throw new BadRequestException(
        'Please enter a valid email and 6-digit OTP.',
      );
    }

    const otpHash = this.hashResetValue(
      'otp',
      `${email}:${otp}`,
    );

    // This raw token is returned only after verification.
    const resetToken = randomBytes(32)
      .toString('hex');

    const resetTokenHash = this.hashResetValue(
      'token',
      resetToken,
    );

    const verified = await this.usersService
      .verifyResetOtp(
        email,
        otpHash,
        resetTokenHash,
        new Date(
          Date.now() + RESET_TOKEN_EXPIRY_MS,
        ),
      );

    if (!verified) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please check your code or request a new one.',
      );
    }

    return {
      message: 'OTP verified successfully.',
      resetToken,
      expiresIn: 600,
    };
  }

  // STEP 3: Reset password using verified token
  async resetPassword(dto: ResetPasswordDto) {
    const resetToken =
      String(dto?.resetToken || '').trim();

    const newPassword =
      String(dto?.newPassword || '');

    const confirmPassword =
      String(dto?.confirmPassword || '');

    if (!/^[a-f0-9]{64}$/.test(resetToken)) {
      throw new BadRequestException(
        'Invalid password reset session. Please verify your email again.',
      );
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      throw new BadRequestException(
        'Password must be between 8 and 128 characters.',
      );
    }

    if (
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      throw new BadRequestException(
        'Password must contain at least one letter and one number.',
      );
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'Passwords do not match.',
      );
    }

    const passwordHash = await hashPassword(
      newPassword,
    );

    const resetTokenHash = this.hashResetValue(
      'token',
      resetToken,
    );

    const userId = await this.usersService
      .updatePasswordWithResetToken(
        resetTokenHash,
        passwordHash,
      );

    if (!userId) {
      throw new BadRequestException(
        'Reset session expired or already used. Please request a new OTP.',
      );
    }

    // A new password ends every existing app session.
    await this.refreshTokensService.revokeAllForUser(userId);

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  // Existing current-user functionality
  async getCurrentUser(
    userId: string,
  ): Promise<{ user: PublicUser }> {
    const user = await this.usersService.findById(
      userId,
    );

    if (!user) {
      throw new UnauthorizedException(
        'User no longer exists.',
      );
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  // Permanently deletes the account and all data stored for it.
  // Dependent data goes first so a failed request can be retried:
  // the user document is only removed once everything else is gone.
  async deleteAccount(userId: string): Promise<void> {
    if (!(await this.usersService.existsById(userId))) {
      throw new NotFoundException('User not found.');
    }

    await Promise.all([
      this.cartService.deleteAllForUser(userId),
      this.devicesService.deleteAllForUser(userId),
      this.savedService.deleteAllForUser(userId),
      this.refreshTokensService.deleteAllForUser(userId),
    ]);

    if (!(await this.usersService.deleteById(userId))) {
      throw new NotFoundException('User not found.');
    }

    this.postHogService.client?.capture({
      event: 'account_deleted',
    });
  }

  // Hash sensitive reset values before MongoDB storage.
  // Exchanges a refresh token for a new access token and a rotated
  // refresh token.
  async refresh(
    refreshToken: string,
    client: RefreshClientInfo = {},
  ) {
    const result = await this.refreshTokensService.rotate(
      refreshToken,
      client,
    );

    if (result.status === 'in_progress') {
      throw new ConflictException('Refresh already in progress.');
    }

    if (result.status === 'reused') {
      this.postHogService.client?.capture({
        distinctId: result.userId,
        event: 'refresh_reuse_detected',
      });
    }

    if (result.status !== 'rotated') {
      throw new UnauthorizedException(
        'Session expired. Please log in again.',
      );
    }

    const user = await this.usersService.findById(result.userId);

    if (!user) {
      await this.refreshTokensService.deleteAllForUser(result.userId);

      throw new UnauthorizedException('User no longer exists.');
    }

    const accessToken = await this.signAccessToken(user);

    this.postHogService.client?.capture({
      distinctId: result.userId,
      event: 'session_refreshed',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      refreshToken: result.issued.refreshToken,
      refreshTokenExpiresAt: result.issued.refreshTokenExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  // Ends the session the refresh token belongs to. Never fails, so the
  // client can call it fire-and-forget.
  async logout(refreshToken: unknown): Promise<void> {
    if (
      typeof refreshToken !== 'string' ||
      !refreshToken ||
      refreshToken.length > 200
    ) {
      return;
    }

    try {
      await this.refreshTokensService.revokeFamilyOf(refreshToken);
    } catch (error) {
      console.error('Unable to revoke refresh token:', error);
    }
  }

  private hashResetValue(
    purpose: 'otp' | 'token',
    value: string,
  ): string {
    return createHmac(
      'sha256',
      env.jwtSecret,
    )
      .update(`password-reset:${purpose}:${value}`)
      .digest('hex');
  }

  private isValidEmail(email: string): boolean {
    return (
      email.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
  }

  private signAccessToken(
    user: UserDocument,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    return this.jwtService.signAsync(payload);
  }

  private async createAuthResponse(
    user: UserDocument,
    client: RefreshClientInfo,
  ) {
    const userId = user._id.toString();
    const accessToken = await this.signAccessToken(user);
    const { refreshToken, refreshTokenExpiresAt } =
      await this.refreshTokensService.issue(userId, client);

    // Account id only: no email or name leaves the server for analytics.
    this.postHogService.client?.identify({
      distinctId: userId,
    });

    return {
      message: 'Authentication successful.',
      user: this.toPublicUser(user),
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.jwtExpiresIn,
      // Ignored by the website; used by the mobile app to stay signed in.
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private toPublicUser(
    user: UserDocument,
  ): PublicUser {
    return {
      id: user._id.toString(),
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.companyName,
      salesPerson: user.salesPerson,
      mobileNumber: user.mobileNumber,
      address: user.address || '',
      state: user.state || '',
      city: user.city || '',
      zipCode: user.zipCode || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isMongoDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}

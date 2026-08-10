import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import {
  hashPassword,
  verifyPassword,
} from '../common/utils/password.util';

import { env } from '../config/env.config';

import {
  UserDocument,
} from '../users/schemas/user.schema';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

import {
  JwtPayload,
} from './interfaces/jwt-payload.interface';

import {
  PublicUser,
} from './interfaces/public-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    signupDto: SignupDto,
  ) {
    const email =
      signupDto.email
        .trim()
        .toLowerCase();

    const existingUser =
      await this.usersService.findByEmail(
        email,
      );

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const firstName =
      signupDto.firstName.trim();

    const lastName =
      signupDto.lastName.trim();

    const name =
      `${firstName} ${lastName}`.trim();

    /*
     * Use your existing password utility.
     * Do not use bcrypt directly here.
     */
    const passwordHash =
      await hashPassword(
        signupDto.password,
      );

    try {
      const user =
        await this.usersService.create({
          name,
          firstName,
          lastName,
          email,
          passwordHash,

          companyName:
            signupDto.companyName.trim(),

          salesPerson:
            signupDto.salesPerson.trim(),

          mobileNumber:
            signupDto.mobileNumber.trim(),

          address:
            signupDto.address?.trim() || '',

          state:
            signupDto.state?.trim() || '',

          city:
            signupDto.city?.trim() || '',

          zipCode:
            signupDto.zipCode?.trim() || '',
        });

      return this.createAuthResponse(
        user,
      );
    } catch (error) {
      if (
        this.isMongoDuplicateKeyError(
          error,
        )
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      console.error(
        'Unable to create user:',
        error,
      );

      throw new InternalServerErrorException(
        'Unable to create the account.',
      );
    }
  }

  async login(
    dto: LoginDto,
  ) {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    const user =
      await this.usersService
        .findByEmailWithPassword(
          email,
        );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordIsValid =
      await verifyPassword(
        dto.password,
        user.passwordHash,
      );

    if (!passwordIsValid) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    return this.createAuthResponse(
      user,
    );
  }

  async getCurrentUser(
    userId: string,
  ): Promise<{
    user: PublicUser;
  }> {
    const user =
      await this.usersService.findById(
        userId,
      );

    if (!user) {
      throw new UnauthorizedException(
        'User no longer exists.',
      );
    }

    return {
      user: this.toPublicUser(
        user,
      ),
    };
  }

  private async createAuthResponse(
    user: UserDocument,
  ) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      message:
        'Authentication successful.',

      user:
        this.toPublicUser(user),

      accessToken,

      tokenType: 'Bearer',

      expiresIn:
        env.jwtExpiresIn,
    };
  }

  private toPublicUser(
    user: UserDocument,
  ): PublicUser {
    return {
      id: user._id.toString(),

      name: user.name,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      email:
        user.email,

      companyName:
        user.companyName,

      salesPerson:
        user.salesPerson,

      mobileNumber:
        user.mobileNumber,

      address:
        user.address || '',

      state:
        user.state || '',

      city:
        user.city || '',

      zipCode:
        user.zipCode || '',

      createdAt:
        user.createdAt,

      updatedAt:
        user.updatedAt,
    };
  }

  private isMongoDuplicateKeyError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (
        error as {
          code?: number;
        }
      ).code === 11000
    );
  }
}
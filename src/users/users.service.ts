// import {
//   Injectable,
// } from '@nestjs/common';

// import {
//   InjectModel,
// } from '@nestjs/mongoose';

// import {
//   Model,
//   Types,
// } from 'mongoose';

// import {
//   User,
//   UserDocument,
// } from './schemas/user.schema';

// interface CreateUserData {
//   name: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   passwordHash: string;
//   companyName: string;
//   salesPerson: string;
//   mobileNumber: string;
//   address?: string;
//   state?: string;
//   city?: string;
//   zipCode?: string;
// }

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectModel(User.name)
//     private readonly userModel:
//       Model<UserDocument>,
//   ) {}

//   async create(
//     userData: CreateUserData,
//   ): Promise<UserDocument> {
//     const user =
//       new this.userModel(
//         userData,
//       );

//     return user.save();
//   }

//   async findByEmail(
//     email: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel
//       .findOne({
//         email:
//           email
//             .trim()
//             .toLowerCase(),
//       })
//       .exec();
//   }

//   async findByEmailWithPassword(
//     email: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel
//       .findOne({
//         email:
//           email
//             .trim()
//             .toLowerCase(),
//       })
//       .select('+passwordHash')
//       .exec();
//   }

//   async findById(
//     userId: string,
//   ): Promise<UserDocument | null> {
//     if (
//       !Types.ObjectId.isValid(
//         userId,
//       )
//     ) {
//       return null;
//     }

//     return this.userModel
//       .findById(userId)
//       .exec();
//   }
// }




// import {
//   Injectable,
// } from '@nestjs/common';

// import {
//   InjectModel,
// } from '@nestjs/mongoose';

// import {
//   Model,
//   Types,
// } from 'mongoose';

// import {
//   User,
//   UserDocument,
// } from './schemas/user.schema';

// interface CreateUserData {
//   name: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   passwordHash: string;
//   companyName: string;
//   salesPerson: string;
//   mobileNumber: string;
//   address?: string;
//   state?: string;
//   city?: string;
//   zipCode?: string;
// }

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectModel(User.name)
//     private readonly userModel:
//       Model<UserDocument>,
//   ) {}

//   async create(
//     userData: CreateUserData,
//   ): Promise<UserDocument> {
//     const user =
//       new this.userModel(
//         userData,
//       );

//     return user.save();
//   }

//   async findByEmail(
//     email: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel
//       .findOne({
//         email:
//           email
//             .trim()
//             .toLowerCase(),
//       })
//       .exec();
//   }

//   async findByEmailWithPassword(
//     email: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel
//       .findOne({
//         email:
//           email
//             .trim()
//             .toLowerCase(),
//       })
//       .select('+passwordHash')
//       .exec();
//   }

//   async findById(
//     userId: string,
//   ): Promise<UserDocument | null> {
//     if (
//       !Types.ObjectId.isValid(
//         userId,
//       )
//     ) {
//       return null;
//     }

//     return this.userModel
//       .findById(userId)
//       .exec();
//   }

//   async updatePasswordByEmail(
//     email: string,
//     passwordHash: string,
//   ): Promise<boolean> {
//     const result =
//       await this.userModel
//         .updateOne(
//           {
//             email:
//               email
//                 .trim()
//                 .toLowerCase(),
//           },
//           {
//             $set: {
//               passwordHash,
//             },
//           },
//         )
//         .exec();

//     return result.modifiedCount > 0;
//   }
// }







import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  User,
  UserDocument,
} from './schemas/user.schema';

interface CreateUserData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  companyName: string;
  salesPerson: string;
  mobileNumber: string;
  address?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    userData: CreateUserData,
  ): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
      })
      .exec();
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
      })
      .select('+passwordHash')
      .exec();
  }

  async findById(
    userId: string,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.userModel
      .findById(userId)
      .exec();
  }

  async existsById(
    userId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) {
      return false;
    }

    const found = await this.userModel
      .exists({ _id: userId })
      .exec();

    return found !== null;
  }

  // Returns true when a user document was removed.
  async deleteById(
    userId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) {
      return false;
    }

    const result = await this.userModel
      .deleteOne({ _id: userId })
      .exec();

    return result.deletedCount > 0;
  }

  // Retained for compatibility with existing services.
  // Never call this from a public password-reset endpoint.
  async updatePasswordByEmail(
    email: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.userModel
      .updateOne(
        {
          email: email.trim().toLowerCase(),
        },
        {
          $set: { passwordHash },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  // Save OTP only if the resend cooldown has passed.
  async beginPasswordReset(
    email: string,
    otpHash: string,
    expiresAt: Date,
    cooldownCutoff: Date,
  ): Promise<boolean> {
    const result = await this.userModel
      .updateOne(
        {
          email: email.trim().toLowerCase(),
          $or: [
            { resetOtpLastSentAt: { $exists: false } },
            {
              resetOtpLastSentAt: {
                $lte: cooldownCutoff,
              },
            },
          ],
        },
        {
          $set: {
            resetOtpHash: otpHash,
            resetOtpExpiresAt: expiresAt,
            resetOtpAttempts: 0,
            resetOtpLastSentAt: new Date(),
          },
          $unset: {
            resetTokenHash: '',
            resetTokenExpiresAt: '',
          },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  // Clean up if OTP delivery fails.
  async cancelPasswordReset(
    email: string,
    otpHash: string,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        {
          email: email.trim().toLowerCase(),
          resetOtpHash: otpHash,
        },
        {
          $unset: {
            resetOtpHash: '',
            resetOtpExpiresAt: '',
          },
          $set: {
            resetOtpAttempts: 0,
          },
        },
      )
      .exec();
  }

  // Atomically verify OTP and issue a reset token.
  async verifyResetOtp(
    email: string,
    otpHash: string,
    resetTokenHash: string,
    resetTokenExpiresAt: Date,
  ): Promise<boolean> {
    const normalizedEmail =
      email.trim().toLowerCase();

    const result = await this.userModel
      .updateOne(
        {
          email: normalizedEmail,
          resetOtpHash: otpHash,
          resetOtpExpiresAt: {
            $gt: new Date(),
          },
          resetOtpAttempts: {
            $lt: 5,
          },
        },
        {
          $set: {
            resetTokenHash,
            resetTokenExpiresAt,
          },
          $unset: {
            resetOtpHash: '',
            resetOtpExpiresAt: '',
          },
        },
      )
      .exec();

    if (result.modifiedCount > 0) {
      return true;
    }

    // Count incorrect attempts only for an active OTP.
    await this.userModel
      .updateOne(
        {
          email: normalizedEmail,
          resetOtpHash: { $exists: true },
          resetOtpExpiresAt: {
            $gt: new Date(),
          },
          resetOtpAttempts: {
            $lt: 5,
          },
        },
        {
          $inc: {
            resetOtpAttempts: 1,
          },
        },
      )
      .exec();

    return false;
  }

  // The reset token is consumed in the same database
  // operation as the password change. Returns the user's id
  // when the password was changed, otherwise null.
  async updatePasswordWithResetToken(
    resetTokenHash: string,
    passwordHash: string,
  ): Promise<string | null> {
    const updated = await this.userModel
      .findOneAndUpdate(
        {
          resetTokenHash,
          resetTokenExpiresAt: {
            $gt: new Date(),
          },
        },
        {
          $set: {
            passwordHash,
            resetOtpAttempts: 0,
          },
          $unset: {
            resetTokenHash: '',
            resetTokenExpiresAt: '',
            resetOtpHash: '',
            resetOtpExpiresAt: '',
          },
        },
        { projection: { _id: 1 } },
      )
      .exec();

    return updated ? updated._id.toString() : null;
  }
}

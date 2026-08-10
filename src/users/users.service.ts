import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

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
    private readonly userModel:
      Model<UserDocument>,
  ) {}

  async create(
    userData: CreateUserData,
  ): Promise<UserDocument> {
    const user =
      new this.userModel(
        userData,
      );

    return user.save();
  }

  async findByEmail(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email:
          email
            .trim()
            .toLowerCase(),
      })
      .exec();
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email:
          email
            .trim()
            .toLowerCase(),
      })
      .select('+passwordHash')
      .exec();
  }

  async findById(
    userId: string,
  ): Promise<UserDocument | null> {
    if (
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      return null;
    }

    return this.userModel
      .findById(userId)
      .exec();
  }
}
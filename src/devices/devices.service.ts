import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { RegisterDeviceDto } from './dto/register-device.dto';
import { Device, DeviceDocument } from './schemas/device.schema';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  // Upserts by token. If another account registered the same token
  // before (shared phone), the token now belongs to this user.
  async register(userId: string, dto: RegisterDeviceDto) {
    const set: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      platform: dto.platform,
    };

    const update =
      dto.appVersion !== undefined
        ? { $set: { ...set, appVersion: dto.appVersion } }
        : { $set: set, $unset: { appVersion: '' } };

    const device = await this.deviceModel
      .findOneAndUpdate({ token: dto.token }, update, {
        upsert: true,
        new: true,
        lean: true,
      })
      .exec();

    return {
      token: device!.token,
      platform: device!.platform,
      appVersion: device!.appVersion ?? null,
      updatedAt: device!.updatedAt,
    };
  }

  // Only the owner can remove its token (app logout).
  async unregister(userId: string, token: string): Promise<void> {
    await this.deviceModel
      .deleteOne({ token, userId: new Types.ObjectId(userId) })
      .exec();
  }

  async findTokensForUser(userId: string): Promise<string[]> {
    const devices = await this.deviceModel
      .find({ userId: new Types.ObjectId(userId) }, { token: 1 })
      .lean()
      .exec();

    return devices.map((device) => device.token);
  }

  // Used when Expo reports a token as no longer registered.
  async deleteByToken(token: string): Promise<void> {
    await this.deviceModel.deleteOne({ token }).exec();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.deviceModel
      .deleteMany({ userId: new Types.ObjectId(userId) })
      .exec();
  }
}

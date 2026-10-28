import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

export const DEVICE_PLATFORMS = ['ios', 'android'] as const;

export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

@Schema({
  collection: 'devices',
  timestamps: { createdAt: false, updatedAt: true },
})
export class Device {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  // Expo push token. One device row per token; a token moves to the
  // most recent account that registered it.
  @Prop({ required: true, unique: true, trim: true })
  token!: string;

  @Prop({ type: String, required: true, enum: DEVICE_PLATFORMS })
  platform!: DevicePlatform;

  @Prop({ type: String, trim: true })
  appVersion?: string;

  updatedAt!: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

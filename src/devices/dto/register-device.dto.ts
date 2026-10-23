import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { DEVICE_PLATFORMS, DevicePlatform } from '../schemas/device.schema';

export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\[\]\s]+\]$/;

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(200)
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message:
      'token must be an Expo push token (ExponentPushToken[...] or ExpoPushToken[...]).',
  })
  token!: string;

  @IsIn(DEVICE_PLATFORMS)
  platform!: DevicePlatform;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;
}

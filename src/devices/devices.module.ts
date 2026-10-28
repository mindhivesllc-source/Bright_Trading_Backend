import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device, DeviceSchema } from './schemas/device.schema';

@Module({
  imports: [
    // The JWT secret is supplied by JwtAuthGuard during verifyAsync().
    JwtModule.register({}),
    UsersModule,
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, JwtAuthGuard, ActiveUserGuard],
  exports: [DevicesService],
})
export class DevicesModule {}

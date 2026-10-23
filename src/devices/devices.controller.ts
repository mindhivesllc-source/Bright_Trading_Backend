import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { getUserId } from '../common/utils/current-user.util';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.devicesService.register(getUserId(request), dto);
  }

  // Called by the app on logout. The token must be URL-encoded.
  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(
    @Req() request: AuthenticatedRequest,
    @Param('token') token: string,
  ): Promise<void> {
    await this.devicesService.unregister(getUserId(request), token);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { getUserId } from '../common/utils/current-user.util';
import { CartService } from './cart.service';
import { PutCartDto } from './dto/put-cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.cartService.get(getUserId(request));
  }

  // The app sends its whole cart; the server copy is replaced.
  @Put()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  replace(
    @Req() request: AuthenticatedRequest,
    @Body() dto: PutCartDto,
  ) {
    return this.cartService.replace(getUserId(request), dto.items);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.cartService.clear(getUserId(request));
  }
}

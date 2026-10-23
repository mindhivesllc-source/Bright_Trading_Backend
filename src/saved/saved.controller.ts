import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { CreateSavedStoneDto } from './dto/create-saved-stone.dto';
import { SavedService } from './saved.service';

@Controller('saved')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class SavedController {
  constructor(private readonly savedService: SavedService) {}

  @Get('stones')
  listStones(@Req() request: AuthenticatedRequest) {
    return this.savedService.listStones(getUserId(request));
  }

  @Post('stones')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  saveStone(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSavedStoneDto,
  ) {
    return this.savedService.saveStone(getUserId(request), dto);
  }

  @Delete('stones/:stockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStone(
    @Req() request: AuthenticatedRequest,
    @Param('stockId') stockId: string,
  ): Promise<void> {
    await this.savedService.removeStone(getUserId(request), stockId);
  }

  @Get('searches')
  listSearches(@Req() request: AuthenticatedRequest) {
    return this.savedService.listSearches(getUserId(request));
  }

  @Post('searches')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createSearch(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.savedService.createSearch(getUserId(request), dto);
  }

  @Delete('searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSearch(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.savedService.removeSearch(getUserId(request), id);
  }
}

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
import { PostHogService } from '../posthog/posthog.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { CreateSavedStoneDto } from './dto/create-saved-stone.dto';
import { SavedService } from './saved.service';

@Controller('saved')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class SavedController {
  constructor(
    private readonly savedService: SavedService,
    private readonly postHogService: PostHogService,
  ) {}

  @Get('stones')
  listStones(@Req() request: AuthenticatedRequest) {
    return this.savedService.listStones(getUserId(request));
  }

  @Post('stones')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async saveStone(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSavedStoneDto,
  ) {
    const stone = await this.savedService.saveStone(
      getUserId(request),
      dto,
    );

    this.postHogService.client?.capture({
      event: 'saved_stone_created',
    });

    return stone;
  }

  @Delete('stones/:stockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStone(
    @Req() request: AuthenticatedRequest,
    @Param('stockId') stockId: string,
  ): Promise<void> {
    await this.savedService.removeStone(getUserId(request), stockId);

    this.postHogService.client?.capture({
      event: 'saved_stone_deleted',
    });
  }

  @Get('searches')
  listSearches(@Req() request: AuthenticatedRequest) {
    return this.savedService.listSearches(getUserId(request));
  }

  @Post('searches')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async createSearch(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSavedSearchDto,
  ) {
    const search = await this.savedService.createSearch(
      getUserId(request),
      dto,
    );

    this.postHogService.client?.capture({
      event: 'saved_search_created',
    });

    return search;
  }

  @Delete('searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSearch(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.savedService.removeSearch(getUserId(request), id);

    this.postHogService.client?.capture({
      event: 'saved_search_deleted',
    });
  }
}

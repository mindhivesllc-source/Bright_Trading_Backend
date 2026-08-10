// import {
//   Body,
//   Controller,
//   Post,
//   Query,
//   UseGuards,
// } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// import { KiraService } from './kira.service';

// function clampInteger(
//   value: string | undefined,
//   minimum: number,
//   maximum: number,
//   fallback: number,
// ): number {
//   const parsedValue = Number(value);

//   if (!Number.isFinite(parsedValue)) {
//     return fallback;
//   }

//   return Math.min(
//     maximum,
//     Math.max(
//       minimum,
//       Math.trunc(parsedValue),
//     ),
//   );
// }

// @Controller('inventory')
// @UseGuards(JwtAuthGuard)
// export class InventoryController {
//   constructor(
//     private readonly kiraService: KiraService,
//   ) {}

//   @Post('search')
//   async searchInventory(
//     @Query('pagestart')
//     pageStartValue?: string,

//     @Query('pageend')
//     pageEndValue?: string,

//     @Body()
//     filters: Record<string, unknown> = {},
//   ) {
//     const pageStart = clampInteger(
//       pageStartValue,
//       1,
//       1_000_000,
//       1,
//     );

//     const requestedPageEnd =
//       clampInteger(
//         pageEndValue,
//         pageStart,
//         1_000_500,
//         pageStart + 199,
//       );

//     const pageEnd = Math.min(
//       requestedPageEnd,
//       pageStart + 499,
//     );

//     return this.kiraService.getInventory({
//       pageStart,
//       pageEnd,
//       filters,
//     });
//   }
// }




import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  SearchInventoryDto,
} from './dto/search-inventory.dto';

import {
  InventorySearchService,
} from './inventory-search.service';

import {
  InventorySyncService,
} from './inventory-sync.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly searchService:
      InventorySearchService,

    private readonly syncService:
      InventorySyncService,
  ) {}

  /*
   * Searches MongoDB.
   * This no longer calls Kira.
   */
  @Post('search')
  searchInventory(
    @Body()
    dto: SearchInventoryDto,
  ) {
    return this.searchService
      .search(dto);
  }

  /*
   * Starts the large CSV import in
   * the background and immediately
   * returns HTTP 202.
   *
   * Add an AdminGuard before production.
   */
  @Post('admin/sync/full')
  @HttpCode(HttpStatus.ACCEPTED)
  startFullSync() {
    return this.syncService
      .startFullSync();
  }

  /*
   * Starts a live availability refresh.
   *
   * Add an AdminGuard before production.
   */
  @Post(
    'admin/sync/availability',
  )
  @HttpCode(HttpStatus.ACCEPTED)
  startAvailabilitySync() {
    return this.syncService
      .startAvailabilitySync();
  }

  @Get('admin/sync/status')
  getSyncStatus() {
    return this.syncService
      .getStatus();
  }
}
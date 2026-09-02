import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchInventoryDto } from './dto/search-inventory.dto';
import { InventorySearchService } from './inventory-search.service';
import { InventorySyncService } from './inventory-sync.service';
import { KiraService } from './kira.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly searchService: InventorySearchService,
    private readonly syncService: InventorySyncService,
    private readonly kiraService: KiraService,
  ) {}

  /*
   * Searches MongoDB.
   */
  @Post('search')
  @UseGuards(JwtAuthGuard)
  searchInventory(
    @Body() dto: SearchInventoryDto,
  ) {
    return this.searchService.search(dto);
  }

  /*
   * =====================================================
   * CERTIFICATE PROXY
   * =====================================================
   *
   * The browser opens OUR backend URL:
   *
   * /api/inventory/certificate/722551357
   *
   * Our backend privately downloads the certificate
   * from Kira and streams it back.
   *
   * Therefore api.kiradiam.com is never exposed
   * to the frontend/browser.
   */
  @Get('certificate/:reportNo')
  async getCertificate(
    @Param('reportNo') reportNo: string,
  ): Promise<StreamableFile> {
    const safeReportNo = String(reportNo || '').trim();

    /*
     * Prevent invalid/path-manipulation values.
     *
     * Normal certificate numbers such as:
     * 722551357
     * LG813609334
     *
     * are supported.
     */
    if (
      !safeReportNo ||
      !/^[A-Za-z0-9._-]+$/.test(safeReportNo)
    ) {
      throw new BadRequestException(
        'Invalid certificate report number.',
      );
    }

    const certificate = await this.kiraService
      .getCertificateByReportNo(safeReportNo);

    /*
     * Stream the supplier response directly
     * back to the browser.
     */
    return new StreamableFile(certificate.stream, {
      type: certificate.contentType || 'application/pdf',
      disposition: `inline; filename="${safeReportNo}.pdf"`,
    });
  }

  /*
   * Starts full inventory synchronization.
   */
  @Post('admin/sync/full')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  startFullSync() {
    return this.syncService.startFullSync();
  }

  /*
   * Starts availability synchronization.
   */
  @Post('admin/sync/availability')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  startAvailabilitySync() {
    return this.syncService.startAvailabilitySync();
  }

  /*
   * Synchronization status.
   */
  @Get('admin/sync/status')
  @UseGuards(JwtAuthGuard)
  getSyncStatus() {
    return this.syncService.getStatus();
  }
}
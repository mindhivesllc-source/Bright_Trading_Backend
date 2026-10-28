import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { InventoryUploadService } from './inventory-upload.service';

/* =========================================================
   ALLOWED FILE TYPES
========================================================= */

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // some OS send this for .xlsx
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/* =========================================================
   CONTROLLER
========================================================= */

@Controller('inventory')
export class InventoryUploadController {
  private readonly logger = new Logger(InventoryUploadController.name);

  constructor(
    private readonly uploadService: InventoryUploadService,
  ) {}

  /*
   * POST /api/inventory/upload
   *
   * Accepts a multipart/form-data request with a single
   * field named "file" containing a .csv, .xlsx, or .xls
   * inventory file.
   *
   * Protected by JWT — only authenticated admin users
   * should call this endpoint (the frontend enforces
   * the email-based check before showing the button).
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // keep file in RAM — no disk writes
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
      },
    }),
  )
  async uploadInventory(
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    /* --------------------------------------------------
       Guard: file must be present
    -------------------------------------------------- */

    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('No file was uploaded.');
    }

    /* --------------------------------------------------
       Guard: mime type check (defence in depth)
    -------------------------------------------------- */

    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    const validExt = ['csv', 'xlsx', 'xls'].includes(ext);
    const validMime = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (!validExt && !validMime) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". ` +
          'Please upload a .csv, .xlsx, or .xls file.',
      );
    }

    this.logger.log(
      `Inventory upload started — file: "${file.originalname}", ` +
        `size: ${(file.size / 1024).toFixed(1)} KB`,
    );

    /* --------------------------------------------------
       Process
    -------------------------------------------------- */

    const result = await this.uploadService.processUpload(
      file.buffer,
      file.originalname,
    );

    return {
      message: `Inventory uploaded successfully — ${result.total} diamonds processed.`,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
      runId: result.runId,
    };
  }
}

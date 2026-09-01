import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KiraService } from './kira.service';

const ADMIN_EXPORT_EMAIL = 'adminstrator@brightdia.com';

type AuthenticatedRequest = Request & {
  user?: Record<string, unknown>;
};

function getAuthenticatedEmail(user?: Record<string, unknown>): string {
  if (!user) {
    return '';
  }

  const candidates = [
    user.email,
    user.businessEmail,
    user.business_email,
    user.username,
    user.preferred_username,
    user.upn,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toLowerCase();
    }
  }

  return '';
}

@Controller('inventory')
export class InventoryExportController {
  constructor(private readonly kiraService: KiraService) {}

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportAllInventory(
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const userEmail = getAuthenticatedEmail(request.user);

    if (userEmail !== ADMIN_EXPORT_EMAIL) {
      throw new ForbiddenException(
        'You do not have permission to export the full inventory.',
      );
    }

    const csvStream = await this.kiraService.downloadFullInventoryCsv();

    const date = new Date().toISOString().slice(0, 10);

    return new StreamableFile(csvStream, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="bright-trading-full-inventory-${date}.csv"`,
    });
  }
}
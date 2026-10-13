// import {
//   Controller,
//   ForbiddenException,
//   Get,
//   Req,
//   StreamableFile,
//   UseGuards,
// } from "@nestjs/common";

// import type { Request } from "express";

// import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
// import { KiraService } from "./kira.service";

// const ADMIN_EXPORT_EMAILS = [
//   'administrator@brightdia.com',
//   'romy@brightdia.in',
// ].map((email) =>
//   email.trim().toLowerCase(),
// );

// type AuthenticatedRequest = Request & {
//   user?: Record<string, unknown>;
// };

// function getAuthenticatedEmail(user?: Record<string, unknown>): string {
//   if (!user) {
//     return "";
//   }

//   const candidates = [
//     user.email,
//     user.businessEmail,
//     user.business_email,
//     user.username,
//     user.preferred_username,
//     user.upn,
//   ];

//   for (const candidate of candidates) {
//     if (typeof candidate === "string" && candidate.trim()) {
//       return candidate.trim().toLowerCase();
//     }
//   }

//   return "";
// }

// @Controller("inventory")
// export class InventoryExportController {
//   constructor(private readonly kiraService: KiraService) {}

//   @Get("export")
//   @UseGuards(JwtAuthGuard)
//   async exportAllInventory(
//     @Req() request: AuthenticatedRequest,
//   ): Promise<StreamableFile> {
//     const userEmail = getAuthenticatedEmail(request.user);

//     if (!ADMIN_EXPORT_EMAILS.includes(userEmail)) {
//       throw new ForbiddenException(
//         "You do not have permission to export the full inventory.",
//       );
//     }

//     const csvStream = await this.kiraService.downloadFullInventoryCsv();

//     const date = new Date().toISOString().slice(0, 10);

//     return new StreamableFile(csvStream, {
//       type: "text/csv; charset=utf-8",
//       disposition: `attachment; filename="bright-trading-full-inventory-${date}.csv"`,
//     });
//   }
// }




import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";

import type { Request } from "express";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { KiraService } from "./kira.service";
import { EasysoftService } from "./easysoft.service";

// =====================================
// ADMIN EMAIL PERMISSIONS
// =====================================

const ADMIN_EXPORT_EMAILS = [
  "administrator@brightdia.com",
  "romy@brightdia.in",
].map((email) =>
  email.trim().toLowerCase(),
);

type AuthenticatedRequest = Request & {
  user?: Record<string, unknown>;
};

// =====================================
// EXTRACT AUTHENTICATED USER EMAIL
// =====================================

function getAuthenticatedEmail(
  user?: Record<string, unknown>,
): string {
  if (!user) {
    return "";
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
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim().toLowerCase();
    }
  }

  return "";
}

// =====================================
// INVENTORY EXPORT CONTROLLER
// =====================================

@Controller("inventory")
export class InventoryExportController {
  constructor(
    private readonly kiraService: KiraService,
    private readonly easysoftService: EasysoftService,
  ) {}

  // =====================================
  // EXISTING BRIGHT INVENTORY EXPORT
  // =====================================

  @Get("export")
  @UseGuards(JwtAuthGuard)
  async exportAllInventory(
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const userEmail = getAuthenticatedEmail(
      request.user,
    );

    if (
      !ADMIN_EXPORT_EMAILS.includes(userEmail)
    ) {
      throw new ForbiddenException(
        "You do not have permission to export the full inventory.",
      );
    }

    const csvStream =
      await this.kiraService.downloadFullInventoryCsv();

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    return new StreamableFile(csvStream, {
      type: "text/csv; charset=utf-8",

      disposition:
        `attachment; filename="bright-trading-full-inventory-${date}.csv"`,
    });
  }

  // =====================================
  // NEW EASYSOFT INVENTORY EXPORT
  // =====================================

  @Get("export/easysoft")
  @UseGuards(JwtAuthGuard)
  async exportEasysoftInventory(
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const userEmail = getAuthenticatedEmail(
      request.user,
    );

    if (
      !ADMIN_EXPORT_EMAILS.includes(userEmail)
    ) {
      throw new ForbiddenException(
        "You do not have permission to export the Easysoft inventory.",
      );
    }

    const csvStream =
      await this.easysoftService.downloadInventoryCsv();

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    return new StreamableFile(csvStream, {
      type: "text/csv; charset=utf-8",

      disposition:
        `attachment; filename="easysoft-full-inventory-${date}.csv"`,
    });
  }
}

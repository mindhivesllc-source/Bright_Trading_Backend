import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  EASYSOFT_DB_CONNECTION,
  KIRA_DB_CONNECTION,
} from '../database/database.constants';

import { EasysoftService } from './easysoft.service';
import { InventoryController } from './inventory.controller';
import { InventoryExportController } from './inventory-export.controller';
import { InventorySearchService } from './inventory-search.service';
import { InventorySyncService } from './inventory-sync.service';
import { KiraService } from './kira.service';

import {
  Diamond,
  DiamondSchema,
} from './schemas/diamond.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60_000,
      maxRedirects: 3,
    }),

    /*
     * JwtService is created here.
     *
     * The JWT secret is supplied by JwtAuthGuard
     * during verifyAsync(), not by this registration.
     */
    JwtModule.register({}),

    /*
     * Kira diamonds live on the dedicated Kira Mongo
     * connection (database: bright_kira).
     */
    MongooseModule.forFeature(
      [
        {
          name: Diamond.name,
          schema: DiamondSchema,
        },
      ],
      KIRA_DB_CONNECTION,
    ),

    /*
     * Easysoft/Braintree diamonds live on the dedicated
     * Easysoft Mongo connection (database: bright_easysoft).
     */
    MongooseModule.forFeature(
      [
        {
          name: Diamond.name,
          schema: DiamondSchema,
        },
      ],
      EASYSOFT_DB_CONNECTION,
    ),
  ],

  controllers: [
    InventoryController,
    InventoryExportController,
  ],

  providers: [
    KiraService,
    EasysoftService,
    InventorySearchService,
    InventorySyncService,
    JwtAuthGuard,
  ],

  exports: [
    InventorySearchService,
    InventorySyncService,
  ],
})
export class InventoryModule {}
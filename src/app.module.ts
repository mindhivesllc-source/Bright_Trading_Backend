
import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import {
  ThrottlerModule,
} from '@nestjs/throttler';

import {
  AppController,
} from './app.controller';

import {
  AuthModule,
} from './auth/auth.module';

import {
  DatabaseModule,
} from './database/database.module';

import {
  InventoryModule,
} from './inventory/inventory.module';

import {
  EnquiriesModule,
} from './enquiries/enquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    DatabaseModule,

    AuthModule,

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 200,
        },
      ],
    }),

    InventoryModule,

    EnquiriesModule,
  ],

  controllers: [
    AppController,
  ],
})
export class AppModule {}
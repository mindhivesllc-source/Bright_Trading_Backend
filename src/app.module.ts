
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

import {
  ScheduleModule,
} from '@nestjs/schedule';

import {
  CartModule,
} from './cart/cart.module';

import {
  DevicesModule,
} from './devices/devices.module';

import {
  SavedModule,
} from './saved/saved.module';

import {
  NotificationsModule,
} from './notifications/notifications.module';

import {
  PostHogModule,
} from './posthog/posthog.module';

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

    // Cron jobs for push notifications (see NotificationsScheduler).
    ScheduleModule.forRoot(),

    CartModule,

    DevicesModule,

    SavedModule,

    NotificationsModule,

    PostHogModule,
  ],

  controllers: [
    AppController,
  ],
})
export class AppModule {}
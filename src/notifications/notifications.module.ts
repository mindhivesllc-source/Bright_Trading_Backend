import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CartModule } from '../cart/cart.module';
import {
  EASYSOFT_DB_CONNECTION,
  KIRA_DB_CONNECTION,
} from '../database/database.constants';
import { DevicesModule } from '../devices/devices.module';
import {
  Diamond,
  DiamondSchema,
} from '../inventory/schemas/diamond.schema';
import { ExpoPushService } from './expo-push.service';
import {
  NOTIFICATIONS_CLOCK,
  NotificationsScheduler,
} from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    CartModule,
    DevicesModule,

    // Read-only access to diamonds for the sold stone check. No
    // existing inventory service looks stones up by number regardless
    // of availability, so the models are injected directly.
    MongooseModule.forFeature(
      [{ name: Diamond.name, schema: DiamondSchema }],
      KIRA_DB_CONNECTION,
    ),
    MongooseModule.forFeature(
      [{ name: Diamond.name, schema: DiamondSchema }],
      EASYSOFT_DB_CONNECTION,
    ),
  ],
  providers: [
    ExpoPushService,
    NotificationsService,
    NotificationsScheduler,
    { provide: NOTIFICATIONS_CLOCK, useValue: () => new Date() },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

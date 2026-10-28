import { Injectable } from '@nestjs/common';

import { DevicesService } from '../devices/devices.service';
import { ExpoPushService } from './expo-push.service';

export interface UserNotification {
  title: string;
  body: string;
  data?: object;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly expoPushService: ExpoPushService,
  ) {}

  // Sends one notification to every device registered by the user.
  async notifyUser(
    userId: string,
    notification: UserNotification,
  ): Promise<void> {
    const tokens = await this.devicesService.findTokensForUser(userId);

    if (!tokens.length) {
      return;
    }

    await this.expoPushService.send(
      tokens.map((to) => ({ to, ...notification })),
    );
  }
}

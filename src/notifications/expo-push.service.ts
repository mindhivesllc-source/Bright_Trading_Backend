import { Injectable, Logger } from '@nestjs/common';

import { DevicesService } from '../devices/devices.service';

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo accepts at most 100 messages per request.
const CHUNK_SIZE = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: object;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(private readonly devicesService: DevicesService) {}

  // Sends messages to Expo. Failures are logged, never thrown, so one
  // bad token or a failed chunk does not stop the remaining sends.
  async send(messages: PushMessage[]): Promise<void> {
    for (let start = 0; start < messages.length; start += CHUNK_SIZE) {
      await this.sendChunk(messages.slice(start, start + CHUNK_SIZE));
    }
  }

  private async sendChunk(chunk: PushMessage[]): Promise<void> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const accessToken = process.env.EXPO_ACCESS_TOKEN;

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let tickets: ExpoPushTicket[];

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: ExpoPushTicket[];
        errors?: unknown;
      } | null;

      if (!response.ok || !Array.isArray(payload?.data)) {
        this.logger.error(
          `Expo push request failed with status ${response.status}: ${JSON.stringify(payload?.errors ?? payload)}`,
        );
        return;
      }

      tickets = payload.data;
    } catch (error) {
      this.logger.error(`Expo push request failed: ${String(error)}`);
      return;
    }

    // Tickets come back in the same order as the messages.
    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (ticket.status !== 'error') {
          return;
        }

        const token = chunk[index]?.to;

        this.logger.warn(
          `Expo push to ${token} failed: ${ticket.details?.error ?? ''} ${ticket.message ?? ''}`.trim(),
        );

        if (ticket.details?.error === 'DeviceNotRegistered' && token) {
          try {
            await this.devicesService.deleteByToken(token);
          } catch (error) {
            this.logger.error(
              `Unable to delete unregistered device ${token}: ${String(error)}`,
            );
          }
        }
      }),
    );
  }
}

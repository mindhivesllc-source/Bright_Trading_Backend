import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';

import { Cart, CartDocument, CartItem } from '../cart/schemas/cart.schema';
import {
  EASYSOFT_DB_CONNECTION,
  KIRA_DB_CONNECTION,
} from '../database/database.constants';
import {
  Diamond,
  DiamondDocument,
} from '../inventory/schemas/diamond.schema';
import { NotificationsService } from './notifications.service';
import { isWithinSendingHours } from './quiet-hours';

export const NOTIFICATIONS_CLOCK = Symbol('NOTIFICATIONS_CLOCK');

export type Clock = () => Date;

export const CART_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

// Carts handled per database round trip.
const BATCH_SIZE = 200;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

type CartSnapshot = Pick<
  Cart,
  'userId' | 'items' | 'updatedAt' | 'soldNotifiedStockIds'
> & { _id: unknown };

type DiamondSnapshot = Pick<
  Diamond,
  'stoneNo' | 'isAvailable' | 'carat' | 'shape'
>;

export function cartReminderBody(items: CartItem[]): string {
  const count = items.length;
  const label = `${count} stone${count === 1 ? '' : 's'}`;

  const prices = items
    .map((item) => item.totalPrice)
    .filter(
      (price): price is number =>
        typeof price === 'number' && Number.isFinite(price),
    );

  if (!prices.length) {
    return label;
  }

  const total = prices.reduce((sum, price) => sum + price, 0);

  return `${label} · total ${usdFormatter.format(total)}`;
}

export function soldStoneBody(diamond: DiamondSnapshot): string {
  const parts = [
    diamond.carat !== undefined && diamond.carat !== null
      ? `${diamond.carat} ct`
      : '',
    diamond.shape ?? '',
    diamond.stoneNo,
  ].filter(Boolean);

  return `${parts.join(' ')} is no longer available`;
}

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  private running = false;

  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,

    @InjectModel(Diamond.name, KIRA_DB_CONNECTION)
    private readonly kiraDiamondModel: Model<DiamondDocument>,

    @InjectModel(Diamond.name, EASYSOFT_DB_CONNECTION)
    private readonly easysoftDiamondModel: Model<DiamondDocument>,

    private readonly notificationsService: NotificationsService,

    @Inject(NOTIFICATIONS_CLOCK)
    private readonly clock: Clock,
  ) {}

  // Every 15 minutes. Disabled unless NOTIFICATIONS_ENABLED=true so
  // staging and local environments never send pushes.
  @Cron('0 */15 * * * *', { name: 'engagement-notifications' })
  async handleCron(): Promise<void> {
    if (process.env.NOTIFICATIONS_ENABLED !== 'true' || this.running) {
      return;
    }

    this.running = true;

    try {
      await this.runAll(this.clock());
    } catch (error) {
      this.logger.error(`Notification run failed: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }

  // Returns false when the run was skipped for quiet hours.
  async runAll(now: Date): Promise<boolean> {
    if (!isWithinSendingHours(now)) {
      return false;
    }

    await this.runCartReminders(now);
    await this.runSoldStoneAlerts();

    return true;
  }

  // One reminder per cart change: the cart must be non-empty, untouched
  // for 24 hours and not reminded since its last change.
  async runCartReminders(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - CART_REMINDER_DELAY_MS);

    const dueFilter = {
      'items.0': { $exists: true },
      updatedAt: { $lt: cutoff },
      $or: [
        { remindedAt: null },
        { $expr: { $lt: ['$remindedAt', '$updatedAt'] } },
      ],
    };

    let sent = 0;

    // Each processed cart drops out of dueFilter, so re-querying the
    // first page walks through all due carts.
    for (;;) {
      const carts = await this.cartModel
        .find(dueFilter)
        .sort({ updatedAt: 1 })
        .limit(BATCH_SIZE)
        .lean<CartSnapshot[]>()
        .exec();

      if (!carts.length) {
        break;
      }

      for (const cart of carts) {
        // Claim the cart first so a second instance cannot send twice.
        const claim = await this.cartModel
          .updateOne(
            { _id: cart._id, ...dueFilter },
            { $set: { remindedAt: now } },
          )
          .exec();

        if (!claim.modifiedCount) {
          continue;
        }

        await this.safeNotify(cart.userId.toString(), {
          title: 'Your cart is waiting',
          body: cartReminderBody(cart.items),
          data: { type: 'cart_reminder' },
        });

        sent += 1;
      }

      if (carts.length < BATCH_SIZE) {
        break;
      }
    }

    return sent;
  }

  // Notifies once per stone when a stone in a cart becomes unavailable.
  // The stone stays in the cart; the app shows it as sold.
  async runSoldStoneAlerts(): Promise<number> {
    let sent = 0;
    let lastId: unknown = null;

    for (;;) {
      const carts = await this.cartModel
        .find({
          'items.productType': 'stone',
          ...(lastId ? { _id: { $gt: lastId } } : {}),
        })
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean<CartSnapshot[]>()
        .exec();

      if (!carts.length) {
        break;
      }

      lastId = carts[carts.length - 1]._id;

      const pendingByCart = carts.map((cart) => {
        const notified = new Set(cart.soldNotifiedStockIds ?? []);

        return {
          cart,
          stockIds: [
            ...new Set(
              cart.items
                .filter(
                  (item) =>
                    item.productType === 'stone' &&
                    typeof item.stockId === 'string',
                )
                .map((item) => item.stockId),
            ),
          ].filter((stockId) => !notified.has(stockId)),
        };
      });

      const sold = await this.findSoldStones(
        pendingByCart.flatMap((entry) => entry.stockIds),
      );

      for (const { cart, stockIds } of pendingByCart) {
        for (const stockId of stockIds) {
          const diamond = sold.get(stockId);

          if (!diamond) {
            continue;
          }

          const claim = await this.cartModel
            .updateOne(
              { _id: cart._id, soldNotifiedStockIds: { $ne: stockId } },
              { $addToSet: { soldNotifiedStockIds: stockId } },
            )
            .exec();

          if (!claim.modifiedCount) {
            continue;
          }

          await this.safeNotify(cart.userId.toString(), {
            title: 'A stone in your cart was sold',
            body: soldStoneBody(diamond),
            data: { type: 'stone_sold', stockId },
          });

          sent += 1;
        }
      }

      if (carts.length < BATCH_SIZE) {
        break;
      }
    }

    return sent;
  }

  // Diamonds live on the Kira and Easysoft connections. A stone counts
  // as sold when it is found with isAvailable === false and is not
  // available on either connection.
  private async findSoldStones(
    stockIds: string[],
  ): Promise<Map<string, DiamondSnapshot>> {
    const sold = new Map<string, DiamondSnapshot>();
    const unique = [...new Set(stockIds)];

    if (!unique.length) {
      return sold;
    }

    const projection = { stoneNo: 1, isAvailable: 1, carat: 1, shape: 1 };

    const results = await Promise.all(
      [this.kiraDiamondModel, this.easysoftDiamondModel].map((model) =>
        model
          .find({ stoneNo: { $in: unique } }, projection)
          .lean<DiamondSnapshot[]>()
          .exec(),
      ),
    );

    const available = new Set<string>();

    for (const diamond of results.flat()) {
      if (diamond.isAvailable === false) {
        sold.set(diamond.stoneNo, diamond);
      } else {
        available.add(diamond.stoneNo);
      }
    }

    for (const stoneNo of available) {
      sold.delete(stoneNo);
    }

    return sold;
  }

  private async safeNotify(
    userId: string,
    notification: { title: string; body: string; data?: object },
  ): Promise<void> {
    try {
      await this.notificationsService.notifyUser(userId, notification);
    } catch (error) {
      this.logger.error(
        `Unable to notify user ${userId}: ${String(error)}`,
      );
    }
  }
}

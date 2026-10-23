import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { MAX_CART_ITEMS } from './dto/put-cart.dto';
import {
  CART_PRODUCT_TYPES,
  Cart,
  CartDocument,
  CartItem,
} from './schemas/cart.schema';

const MAX_STOCK_ID_LENGTH = 100;

export interface CartView {
  items: CartItem[];
  updatedAt: Date | null;
}

// Serialises with sorted keys so that two carts with the same
// content compare equal regardless of key order.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify(
            (value as Record<string, unknown>)[key],
          )}`,
      );

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async get(userId: string): Promise<CartView> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    return {
      items: cart?.items ?? [],
      updatedAt: cart?.updatedAt ?? null,
    };
  }

  async replace(
    userId: string,
    rawItems: Record<string, unknown>[],
  ): Promise<CartView> {
    const items = this.validateItems(rawItems);
    const ownerId = new Types.ObjectId(userId);

    const existing = await this.cartModel
      .findOne({ userId: ownerId })
      .lean()
      .exec();

    // The app may re-sync an unchanged cart. Leave updatedAt and
    // remindedAt alone then, so the reminder is not re-armed.
    if (
      existing &&
      stableStringify(existing.items) === stableStringify(items)
    ) {
      return { items: existing.items, updatedAt: existing.updatedAt };
    }

    const stockIds = new Set(items.map((item) => item.stockId));
    const soldNotifiedStockIds = (
      existing?.soldNotifiedStockIds ?? []
    ).filter((stockId) => stockIds.has(stockId));

    const saved = await this.cartModel
      .findOneAndUpdate(
        { userId: ownerId },
        {
          $set: {
            items,
            updatedAt: new Date(),
            remindedAt: null,
            soldNotifiedStockIds,
          },
        },
        { upsert: true, new: true, lean: true },
      )
      .exec();

    return { items: saved!.items, updatedAt: saved!.updatedAt };
  }

  async clear(userId: string): Promise<void> {
    await this.cartModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            items: [],
            updatedAt: new Date(),
            remindedAt: null,
            soldNotifiedStockIds: [],
          },
        },
      )
      .exec();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.cartModel
      .deleteMany({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  private validateItems(rawItems: Record<string, unknown>[]): CartItem[] {
    if (rawItems.length > MAX_CART_ITEMS) {
      throw new BadRequestException(
        `A cart can hold at most ${MAX_CART_ITEMS} items.`,
      );
    }

    return rawItems.map((item, index) => {
      const { stockId, productType } = item;

      if (
        typeof stockId !== 'string' ||
        !stockId.trim() ||
        stockId.length > MAX_STOCK_ID_LENGTH
      ) {
        throw new BadRequestException(
          `items.${index}.stockId must be a non-empty string.`,
        );
      }

      if (
        typeof productType !== 'string' ||
        !(CART_PRODUCT_TYPES as readonly string[]).includes(productType)
      ) {
        throw new BadRequestException(
          `items.${index}.productType must be one of: ${CART_PRODUCT_TYPES.join(', ')}.`,
        );
      }

      return item as CartItem;
    });
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

export const CART_PRODUCT_TYPES = ['stone', 'melee'] as const;

export type CartProductType = (typeof CART_PRODUCT_TYPES)[number];

// Items are stored exactly as the app sends them. Only these
// fields are guaranteed; anything else is passed through.
export interface CartItem {
  stockId: string;
  productType: CartProductType;
  addedAt?: number;
  totalPrice?: number;
  [key: string]: unknown;
}

// updatedAt is managed by CartService rather than Mongoose timestamps:
// it must only move when the items change, otherwise writing remindedAt
// or soldNotifiedStockIds would re-arm the cart reminder.
@Schema({
  collection: 'carts',
  timestamps: false,
  minimize: false,
})
export class Cart {
  @Prop({
    type: SchemaTypes.ObjectId,
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  items!: CartItem[];

  @Prop({ type: Date, required: true, default: () => new Date() })
  updatedAt!: Date;

  @Prop({ type: Date, default: null })
  remindedAt?: Date | null;

  @Prop({ type: [String], default: [] })
  soldNotifiedStockIds!: string[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Supports the cart reminder scan.
CartSchema.index({ updatedAt: 1 });

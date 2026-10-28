import { ArrayMaxSize, IsArray, IsObject } from 'class-validator';

export const MAX_CART_ITEMS = 200;

// Item objects are not class instances, so the global whitelist does
// not strip their keys. CartService validates each item by hand.
export class PutCartDto {
  @IsArray()
  @ArrayMaxSize(MAX_CART_ITEMS)
  @IsObject({ each: true })
  items!: Record<string, unknown>[];
}

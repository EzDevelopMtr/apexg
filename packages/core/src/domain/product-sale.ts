import type { IsoDate } from "./calendar";
import type { ClientId } from "./client";
import type { InventoryItemId } from "./inventory";
import type { Money } from "./money";
import type { PaymentMethod } from "./payment";

declare const productSaleIdBrand: unique symbol;
export type ProductSaleId = string & { readonly [productSaleIdBrand]: true };

export function toProductSaleId(value: string): ProductSaleId {
  return value as ProductSaleId;
}

/**
 * A gym product sold over the counter (protein, water, etc.) — distinct
 * from a membership {@link Payment}: no balance, no instalments, no
 * commission. Registering one discounts the item's stock (RF-28/29).
 */
export interface ProductSale {
  readonly id: ProductSaleId;
  readonly inventoryItemId: InventoryItemId;
  readonly itemName: string;
  /** Absent for a counter sale with no client on record. */
  readonly clientId?: ClientId;
  readonly clientName?: string;
  readonly quantity: number;
  readonly amount: Money;
  readonly paymentMethod: PaymentMethod;
  readonly soldOn: IsoDate;
  readonly notes: string;
}

import type { PaymentMethod, ProductSale } from "@apexg/core";
import {
  fromApiString,
  toApiString,
  toClientId,
  toInventoryItemId,
  toIsoDate,
  toProductSaleId,
} from "@apexg/core";
import type { ProductSaleRepository } from "../repositories";
import { apiFetch } from "./http-client";

interface ApiProductSaleResult {
  id: string;
  inventoryItemId: string;
  itemName: string;
  clientId: string | null;
  clientName: string | null;
  quantity: string;
  amount: string;
  paymentMethod: string;
  soldAt: string;
  notes: string | null;
}

/** Up to 3 decimals, matching `inventory_items` (`NUMERIC(12,3)`) — same rule as `HttpInventoryRepository`. */
function toQuantityString(value: number): string {
  return (Math.round(value * 1000) / 1000).toString();
}

function fromResult(row: ApiProductSaleResult): ProductSale {
  return {
    id: toProductSaleId(row.id),
    inventoryItemId: toInventoryItemId(row.inventoryItemId),
    itemName: row.itemName,
    clientId: row.clientId ? toClientId(row.clientId) : undefined,
    clientName: row.clientName ?? undefined,
    quantity: Number(row.quantity),
    amount: fromApiString(row.amount),
    paymentMethod: row.paymentMethod as PaymentMethod,
    // `sold_at` is a TIMESTAMPTZ instant; the calendar day it happened on
    // uses local components (see `toIsoDate`), same fix as `paidOn`.
    soldOn: toIsoDate(new Date(row.soldAt)),
    notes: row.notes ?? "",
  };
}

export class HttpProductSaleRepository implements ProductSaleRepository {
  async list(): Promise<readonly ProductSale[]> {
    const rows = await apiFetch<ApiProductSaleResult[]>("/product-sales");
    return rows.map(fromResult);
  }

  async create(
    draft: Omit<ProductSale, "id" | "itemName" | "clientName">,
  ): Promise<ProductSale> {
    const row = await apiFetch<ApiProductSaleResult>("/product-sales", {
      method: "POST",
      body: {
        inventoryItemId: draft.inventoryItemId,
        clientId: draft.clientId,
        quantity: toQuantityString(draft.quantity),
        amount: toApiString(draft.amount),
        paymentMethod: draft.paymentMethod,
        notes: draft.notes.trim() === "" ? undefined : draft.notes,
      },
    });
    return fromResult(row);
  }
}

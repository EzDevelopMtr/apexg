"use client";

import { AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@apexg/core";

/** RF-30: warns when stock has fallen to or below the configured minimum. */
export default function LowStockNotice({
  items,
}: {
  items: readonly InventoryItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4"
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-orange-600" />
      <div>
        <p className="font-semibold text-orange-900">
          {items.length}{" "}
          {items.length === 1
            ? "ítem está en su mínimo o por debajo"
            : "ítems están en su mínimo o por debajo"}
        </p>
        <p className="mt-1 text-sm text-orange-800">
          {items.map((item) => item.name).join(", ")}
        </p>
      </div>
    </div>
  );
}

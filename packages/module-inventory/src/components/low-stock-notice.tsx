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
      className="mb-6 flex items-start gap-3 rounded-2xl border border-warn-line bg-warn-soft p-4"
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warn-ink" />
      <div>
        <p className="font-semibold text-warn-ink">
          {items.length}{" "}
          {items.length === 1
            ? "ítem está en su mínimo o por debajo"
            : "ítems están en su mínimo o por debajo"}
        </p>
        <p className="mt-1 text-sm text-warn-ink">
          {items.map((item) => item.name).join(", ")}
        </p>
      </div>
    </div>
  );
}

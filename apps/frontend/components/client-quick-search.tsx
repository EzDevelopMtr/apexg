"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Client } from "@apexg/core";
import { useGymPath } from "../lib/gym-path";
import { useQuickClientSearch } from "../lib/use-quick-client-search";

/**
 * Finding someone is the most frequent thing done in the app, and it used to
 * mean opening Clientes first. From here a name or document opens the list
 * already filtered to them.
 */
export default function ClientQuickSearch({ clients }: { clients: readonly Client[] }) {
  const router = useRouter();
  const to = useGymPath();
  const { query, setQuery, matches } = useQuickClientSearch(clients);
  const open = (client: Client) =>
    router.push(to(`/modules/clients/all?q=${encodeURIComponent(client.fullName)}`));

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body-faint" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          const first = matches[0];
          if (event.key === "Enter" && first) open(first);
          if (event.key === "Escape") setQuery("");
        }}
        placeholder="Buscar cliente por nombre o documento"
        aria-label="Buscar cliente"
        className="h-11 w-full rounded-xl border border-line bg-panel pl-10 pr-3 text-sm text-body outline-none transition placeholder:text-body-faint focus:border-brand"
      />
      {query.trim() && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-2xl">
          {matches.length ? (
            matches.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => open(client)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-panel"
                >
                  <span className="truncate font-medium text-body">{client.fullName}</span>
                  <span className="shrink-0 text-xs text-body-faint">{client.idNumber}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-body-faint">Nadie con ese nombre o documento.</li>
          )}
        </ul>
      )}
    </div>
  );
}

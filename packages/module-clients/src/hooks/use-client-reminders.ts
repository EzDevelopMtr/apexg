"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientId, ReminderRecord } from "@apexg/core";
import { useRepositories } from "@apexg/module-kit";

export interface UseClientRemindersResult {
  /** Each client's latest reminder, by client. */
  readonly latest: ReadonlyMap<ClientId, ReminderRecord>;
  /** Records a reminder just opened. Never blocks the chat from opening. */
  readonly record: (clientId: ClientId) => void;
}

/** Who was already reminded, so nobody writes to the same client twice. */
export function useClientReminders(): UseClientRemindersResult {
  const { clientReminders } = useRepositories();
  const [latest, setLatest] = useState<ReadonlyMap<ClientId, ReminderRecord>>(new Map());

  useEffect(() => {
    let alive = true;
    clientReminders
      .listLatest()
      .then((rows) => alive && setLatest(new Map(rows.map((row) => [row.clientId, row]))))
      // A missing mark is a lesser harm than a list that fails to show: the
      // reminders are a hint for the desk, not data anyone is paid on.
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [clientReminders]);

  const record = useCallback(
    (clientId: ClientId) => {
      clientReminders
        .record(clientId)
        .then((saved) => setLatest((current) => new Map(current).set(clientId, saved)))
        .catch(() => undefined);
    },
    [clientReminders],
  );

  return { latest, record };
}

import type { DailyLogNote, IsoDate, MonthlyClosure } from "@apexg/core";
import { toIsoDate, today } from "@apexg/core";
import type { DailyLogRepository } from "../repositories";
import { apiFetch } from "./http-client";

interface ApiDailyLogSummary {
  date: string;
  observations: string | null;
  /** `null` means no `daily_logs` row exists yet for this date — the signal `addNote` uses to POST vs PATCH. */
  updatedAt: string | null;
}

interface ApiMonthlyClosureResult {
  id: string;
  year: number;
  month: number;
  observations: string | null;
  closedBy: string | null;
  closedAt: string | null;
}

/**
 * `daily_logs` has one `observations` string per day (RF-34) — the UI lets
 * staff add several independent notes to the same day, each with its own
 * author. Multiple notes travel folded into that one string, each preceded
 * by a marker line, and are split back apart on read. Two people saving a
 * note for the same day at nearly the same moment could still race (read
 * the day, append, write back) and one could overwrite the other's —
 * accepted as a real but small risk, not solvable without a backend model
 * change (a real `daily_log_notes` table).
 */
const NOTE_MARKER = "### ";

function composeObservations(
  existing: string | null,
  recordedBy: string,
  text: string,
): string {
  const entry = `${NOTE_MARKER}${recordedBy}\n${text}`;
  return existing && existing.trim() ? `${existing}\n${entry}` : entry;
}

/**
 * Text written before this convention existed (or before the day's first
 * marked note) has no marker at all, and sits BEFORE the first one, not
 * necessarily at the very start of a blob that later grew marked entries —
 * finding the marker's position, not just checking the start, is what
 * keeps that legacy text from swallowing a real note that follows it.
 */
function parseNotes(date: string, observations: string | null): DailyLogNote[] {
  const trimmed = observations?.trim() ?? "";
  if (!trimmed) return [];

  const markerIndex = trimmed.indexOf(NOTE_MARKER);
  if (markerIndex === -1) {
    return [
      { id: `${date}#0`, on: date as IsoDate, text: trimmed, recordedBy: "" },
    ];
  }

  const notes: DailyLogNote[] = [];
  const preamble = trimmed.slice(0, markerIndex).trim();
  if (preamble) {
    notes.push({
      id: `${date}#0`,
      on: date as IsoDate,
      text: preamble,
      recordedBy: "",
    });
  }

  const blocks = trimmed
    .slice(markerIndex)
    .split(new RegExp(`^${NOTE_MARKER}`, "m"))
    .filter((b) => b.trim());
  for (const block of blocks) {
    const newlineIndex = block.indexOf("\n");
    const recordedBy =
      newlineIndex === -1 ? block.trim() : block.slice(0, newlineIndex).trim();
    const text =
      newlineIndex === -1 ? "" : block.slice(newlineIndex + 1).trim();
    notes.push({
      id: `${date}#${notes.length}`,
      on: date as IsoDate,
      text,
      recordedBy,
    });
  }
  return notes;
}

function fromClosureResult(row: ApiMonthlyClosureResult): MonthlyClosure {
  return {
    month: `${String(row.year).padStart(4, "0")}-${String(row.month).padStart(2, "0")}`,
    notes: row.observations ?? "",
    closedBy: row.closedBy ?? "",
    // `closedAt` is only nullable in the type, not in practice: every row
    // is inserted with it set. `today()` is a defensive fallback for a
    // case the schema should never actually produce.
    closedOn: row.closedAt ? toIsoDate(new Date(row.closedAt)) : today(),
  };
}

export class HttpDailyLogRepository implements DailyLogRepository {
  /**
   * There is no "list every day's log" endpoint, only `GET /daily-log?date=`
   * for one date at a time — so this reads only TODAY's notes rather than
   * fanning out over a date range nobody asked for. `DailyLogHistory` will
   * only show today's entries until that's revisited (needs either a real
   * list endpoint or an explicit decision to pay for a multi-day fetch).
   */
  async listNotes(): Promise<readonly DailyLogNote[]> {
    const summary = await apiFetch<ApiDailyLogSummary>("/daily-log", {
      searchParams: { date: today() },
    });
    return parseNotes(summary.date, summary.observations);
  }

  async addNote(draft: Omit<DailyLogNote, "id">): Promise<DailyLogNote> {
    const summary = await apiFetch<ApiDailyLogSummary>("/daily-log", {
      searchParams: { date: draft.on },
    });
    const composed = composeObservations(
      summary.observations,
      draft.recordedBy,
      draft.text,
    );
    const index = parseNotes(draft.on, summary.observations).length;

    if (summary.updatedAt === null) {
      await apiFetch("/daily-log", {
        method: "POST",
        body: { date: draft.on, observations: composed },
      });
    } else {
      await apiFetch(`/daily-log/${draft.on}`, {
        method: "PATCH",
        body: { observations: composed },
      });
    }

    return {
      id: `${draft.on}#${index}`,
      on: draft.on,
      text: draft.text,
      recordedBy: draft.recordedBy,
    };
  }

  async listClosures(): Promise<readonly MonthlyClosure[]> {
    const rows = await apiFetch<ApiMonthlyClosureResult[]>(
      "/finance/monthly-closures",
    );
    return rows.map(fromClosureResult);
  }

  /** Always creates: `POST /finance/monthly-closures` has no matching PATCH (a month closes once, RNF-07). */
  async saveClosure(closure: MonthlyClosure): Promise<MonthlyClosure> {
    const [year, month] = closure.month.split("-").map(Number);
    const row = await apiFetch<ApiMonthlyClosureResult>(
      "/finance/monthly-closures",
      {
        method: "POST",
        body: { year, month, observations: closure.notes || undefined },
      },
    );
    return fromClosureResult(row);
  }
}

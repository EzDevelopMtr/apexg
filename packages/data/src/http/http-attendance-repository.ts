import type { Attendance, ClientId } from "@apexg/core";
import { toAttendanceId, toClientId, toIsoDate } from "@apexg/core";
import type {
  AttendanceCandidate,
  AttendanceRepository,
} from "../repositories";
import { apiFetch } from "./http-client";

interface ApiAttendance {
  id: string;
  clientId: string;
  clientName: string;
  checkIn: string;
  checkOut: string | null;
  membershipName: string | null;
  weeklyVisits: number;
  usedThisWeek: number;
}

interface ApiCandidate {
  clientId: string;
  clientName: string;
  idNumber: string;
  status: "active" | "inactive" | "overdue" | null;
  membershipName: string | null;
  expirationDate: string | null;
  weeklyVisits: number;
  usedThisWeek: number;
  inside: boolean;
}

/**
 * `HH:MM` local from a UTC instant.
 *
 * Read through a real `Date` rather than sliced off the ISO string: the
 * backend stores TIMESTAMPTZ, and slicing would show UTC's clock, which is
 * five hours ahead of Colombia's.
 */
function localTime(instant: string): string {
  return new Date(instant).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fromApi(row: ApiAttendance): Attendance {
  return {
    id: toAttendanceId(row.id),
    clientId: toClientId(row.clientId),
    clientName: row.clientName,
    day: toIsoDate(new Date(row.checkIn)),
    enteredAt: localTime(row.checkIn),
    leftAt: row.checkOut === null ? "" : localTime(row.checkOut),
    membershipName: row.membershipName ?? "Sin membresía",
    weeklyVisits: row.weeklyVisits,
    usedThisWeek: row.usedThisWeek,
  };
}

function candidateFromApi(row: ApiCandidate): AttendanceCandidate {
  return {
    clientId: toClientId(row.clientId),
    clientName: row.clientName,
    idNumber: row.idNumber,
    status: row.status,
    membershipName: row.membershipName ?? "Sin membresía",
    expiresOn: row.expirationDate,
    weeklyVisits: row.weeklyVisits,
    usedThisWeek: row.usedThisWeek,
    inside: row.inside,
  };
}

export class HttpAttendanceRepository implements AttendanceRepository {
  async listToday(): Promise<readonly Attendance[]> {
    const rows = await apiFetch<ApiAttendance[]>("/attendances");
    return rows.map(fromApi);
  }

  async search(query: string): Promise<readonly AttendanceCandidate[]> {
    const rows = await apiFetch<ApiCandidate[]>("/attendances/search", {
      searchParams: { q: query },
    });
    return rows.map(candidateFromApi);
  }

  async checkIn(clientId: ClientId): Promise<Attendance> {
    const row = await apiFetch<ApiAttendance>("/attendances", {
      method: "POST",
      body: { clientId },
    });
    return fromApi(row);
  }

  async checkOut(clientId: ClientId): Promise<Attendance> {
    const row = await apiFetch<ApiAttendance>(
      `/attendances/${clientId}/check-out`,
      { method: "POST" },
    );
    return fromApi(row);
  }
}

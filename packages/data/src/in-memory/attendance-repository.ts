import type { Attendance, ClientId } from "@apexg/core";
import type {
  AttendanceCandidate,
  AttendanceRepository,
} from "../repositories";

/**
 * No attendance without a server.
 *
 * The in-memory set exists to run the app against seeds; check-in is a clock
 * event the backend owns, so there is nothing sensible to fake here. Empty
 * results rather than invented ones: a panel showing people who never came
 * would be worse than one showing nobody.
 */
export class InMemoryAttendanceRepository implements AttendanceRepository {
  async listToday(): Promise<readonly Attendance[]> {
    return [];
  }

  async search(): Promise<readonly AttendanceCandidate[]> {
    return [];
  }

  async checkIn(_clientId: ClientId): Promise<Attendance> {
    throw new Error("El registro de ingreso requiere el backend.");
  }

  async checkOut(_clientId: ClientId): Promise<Attendance> {
    throw new Error("El registro de salida requiere el backend.");
  }
}

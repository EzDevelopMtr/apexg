import type {
  Client,
  ClientDraft,
  ClientId,
  Commission,
  DailyLogNote,
  Expense,
  ExpenseCategory,
  InventoryItem,
  InventoryItemId,
  MembershipType,
  MembershipTypeId,
  MonthlyClosure,
  Payment,
  Trainer,
  TrainerId,
} from "@apexg/core";

/**
 * The contracts the application reads and writes through.
 *
 * Components depend on these, never on a concrete source. Swapping the
 * in-memory implementations for HTTP ones requires no UI change.
 *
 * Every method is asynchronous even though today's implementations are not:
 * the backend will be, and designing for it now keeps that swap invisible.
 */

export interface ClientRepository {
  list(): Promise<readonly Client[]>;
  findById(id: ClientId): Promise<Client | undefined>;
  /** Generates the id and derives the expiration date (RF-07). */
  create(draft: ClientDraft): Promise<Client>;
  update(client: Client): Promise<Client>;
}

export interface MembershipTypeRepository {
  list(): Promise<readonly MembershipType[]>;
  findById(id: MembershipTypeId): Promise<MembershipType | undefined>;
  /** RF-12. Only an admin reaches this; the guard lives in the UI and the API. */
  save(type: MembershipType): Promise<MembershipType>;
  remove(id: MembershipTypeId): Promise<void>;
}

export interface PaymentRepository {
  list(): Promise<readonly Payment[]>;
  /**
   * Records a payment (RF-17).
   *
   * Payments are append-only: RNF-07 forbids editing financial records
   * retroactively without a trace, so there is deliberately no `update`.
   */
  record(draft: Omit<Payment, "id">): Promise<Payment>;
}

export interface TrainerRepository {
  list(): Promise<readonly Trainer[]>;
  findById(id: TrainerId): Promise<Trainer | undefined>;
  create(draft: Omit<Trainer, "id">): Promise<Trainer>;
  update(trainer: Trainer): Promise<Trainer>;
  listCommissions(): Promise<readonly Commission[]>;
  recordCommission(draft: Omit<Commission, "id">): Promise<Commission>;
}

export interface ExpenseRepository {
  list(): Promise<readonly Expense[]>;
  create(draft: Omit<Expense, "id">): Promise<Expense>;
  listCategories(): Promise<readonly ExpenseCategory[]>;
  saveCategory(category: ExpenseCategory): Promise<ExpenseCategory>;
}

export interface InventoryRepository {
  list(): Promise<readonly InventoryItem[]>;
  findById(id: InventoryItemId): Promise<InventoryItem | undefined>;
  create(draft: Omit<InventoryItem, "id">): Promise<InventoryItem>;
  update(item: InventoryItem): Promise<InventoryItem>;
}

export interface DailyLogRepository {
  listNotes(): Promise<readonly DailyLogNote[]>;
  addNote(draft: Omit<DailyLogNote, "id">): Promise<DailyLogNote>;
  listClosures(): Promise<readonly MonthlyClosure[]>;
  saveClosure(closure: MonthlyClosure): Promise<MonthlyClosure>;
}

/** Everything the application needs to read and write. */
export interface Repositories {
  readonly clients: ClientRepository;
  readonly membershipTypes: MembershipTypeRepository;
  readonly payments: PaymentRepository;
  readonly trainers: TrainerRepository;
  readonly expenses: ExpenseRepository;
  readonly inventory: InventoryRepository;
  readonly dailyLog: DailyLogRepository;
}

/** Raised when a write targets a record that no longer exists. */
export class RecordNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`No ${entity} with id ${id}`);
    this.name = "RecordNotFoundError";
  }
}

/** Raised when a client references a membership type that is not in the catalogue. */
export class UnknownMembershipTypeError extends Error {
  constructor(readonly membershipTypeId: string) {
    super(`No membership type with id ${membershipTypeId}`);
    this.name = "UnknownMembershipTypeError";
  }
}

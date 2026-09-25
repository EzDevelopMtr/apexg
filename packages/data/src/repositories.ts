import type {
  Attendance,
  Client,
  ClientDraft,
  ClientId,
  ClientStatus,
  Commission,
  DailyLogNote,
  Expense,
  ExpenseCategory,
  InventoryCategory,
  InventoryItem,
  InventoryItemId,
  MembershipType,
  MembershipTypeId,
  MonthlyClosure,
  Payment,
  PaymentId,
  Money,
  ProductSale,
  SavingsContribution,
  SavingsPocketId,
  Trainer,
  TrainerId,
} from "@apexg/core";
import type { PocketWithSaved } from "./http/http-savings-repository";

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
  /**
   * Generates the id and derives the expiration date (RF-07).
   *
   * La foto viaja en la MISMA llamada: entre dos peticiones existiría un
   * cliente sin foto y, si la segunda fallara, un archivo huérfano.
   */
  create(draft: ClientDraft, photo?: Blob): Promise<Client>;
  update(client: Client, photo?: Blob): Promise<Client>;
  /**
   * Dónde abrir la foto de un cliente.
   *
   * La arma esta capa para que ningún módulo tenga que saber que la API vive
   * detrás de `/api/backend`. La dirección es todo lo que recibe un
   * componente: el archivo lo sirve un endpoint que comprueba permisos, nunca
   * una carpeta pública.
   */
  photoUrl(clientId: ClientId): string;
  /**
   * Opens a new period on the SAME plan, closing the previous one.
   *
   * Renewing is not editing: payments hang off the membership they were made
   * against, so reopening dates on the old one would rewrite what was paid
   * for (RNF-07).
   */
  renew(clientId: ClientId): Promise<Client>;
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
   *
   * The receipt travels in the SAME request as the payment, not a follow-up
   * call: between two calls an electronic payment would exist with no
   * evidence attached, which is the state the rule exists to prevent.
   */
  record(draft: Omit<Payment, "id">, receipt?: Blob): Promise<Payment>;
  /**
   * Where to open a payment's receipt.
   *
   * Built here rather than in a component so no module has to know the API
   * lives behind `/api/backend`. The address is all a component gets: the file
   * is served by an endpoint that checks permissions, never from a public
   * folder, so there is no direct path to hand out.
   */
  receiptUrl(paymentId: PaymentId): string;
}

/**
 * A client as the check-in panel needs them: who they are, what plan they
 * carry, and how much of this week's allowance they have spent.
 *
 * A read model, not a domain entity — it exists because the panel would
 * otherwise make three round trips per keystroke to assemble the same row.
 */
export interface AttendanceCandidate {
  readonly clientId: ClientId;
  readonly clientName: string;
  readonly idNumber: string;
  /**
   * Standing of the membership, or null when there is none at all. The panel
   * refuses an entry on this before it even looks at the weekly allowance.
   */
  readonly status: ClientStatus | null;
  /** Plan name, or "Sin membresía" when the client has none. */
  readonly membershipName: string;
  /** `YYYY-MM-DD`, or null when there is no membership. */
  readonly expiresOn: string | null;
  /** Days a week the plan grants, 1 to 6. */
  readonly weeklyVisits: number;
  readonly usedThisWeek: number;
  /** Already in the gym and not yet marked out. */
  readonly inside: boolean;
  /** Si tiene foto. La dirección la arma `ClientRepository.photoUrl`. */
  readonly hasPhoto: boolean;
}

export interface AttendanceRepository {
  /** Today's entries, most recent first. */
  listToday(): Promise<readonly Attendance[]>;
  /** Clients matching a name fragment, with their week's standing. */
  search(query: string): Promise<readonly AttendanceCandidate[]>;
  /**
   * Records an entry (the server stamps the time).
   *
   * Each entry spends a day of the weekly allowance, so signing someone back
   * in after a check-out counts again — which is what the gym is selling.
   */
  checkIn(clientId: ClientId): Promise<Attendance>;
  /** Closes the client's open entry. */
  checkOut(clientId: ClientId): Promise<Attendance>;
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
  listCategories(): Promise<readonly InventoryCategory[]>;
  saveCategory(category: InventoryCategory): Promise<InventoryCategory>;
}

export interface DailyLogRepository {
  listNotes(): Promise<readonly DailyLogNote[]>;
  addNote(draft: Omit<DailyLogNote, "id">): Promise<DailyLogNote>;
  listClosures(): Promise<readonly MonthlyClosure[]>;
  saveClosure(closure: MonthlyClosure): Promise<MonthlyClosure>;
}

export interface ProductSaleRepository {
  list(): Promise<readonly ProductSale[]>;
  /** Records a sale and discounts the item's stock (RF-28/29), atomically on the backend. */
  create(
    draft: Omit<ProductSale, "id" | "itemName" | "clientName" | "recordedBy">,
  ): Promise<ProductSale>;
}

/**
 * Bolsillos de ahorro: apartar utilidad con un destino concreto.
 *
 * No hay `remove`: un bolsillo se cierra (`updatePocket({ closed: true })`) y
 * conserva sus aportes, que son registros financieros (RNF-07). Los aportes
 * tampoco se editan — para deshacer uno se registra otro en contra.
 */
export interface SavingsRepository {
  listPockets(): Promise<readonly PocketWithSaved[]>;
  createPocket(name: string, goal: Money): Promise<PocketWithSaved>;
  updatePocket(
    id: SavingsPocketId,
    changes: { name?: string; goal?: Money; closed?: boolean },
  ): Promise<PocketWithSaved>;
  listContributions(): Promise<readonly SavingsContribution[]>;
  contribute(
    pocketId: SavingsPocketId,
    amount: Money,
    notes: string,
  ): Promise<SavingsContribution>;
}

/** Everything the application needs to read and write. */
export interface Repositories {
  readonly clients: ClientRepository;
  readonly membershipTypes: MembershipTypeRepository;
  readonly payments: PaymentRepository;
  readonly attendances: AttendanceRepository;
  readonly trainers: TrainerRepository;
  readonly expenses: ExpenseRepository;
  readonly inventory: InventoryRepository;
  readonly dailyLog: DailyLogRepository;
  readonly productSales: ProductSaleRepository;
  readonly savings: SavingsRepository;
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

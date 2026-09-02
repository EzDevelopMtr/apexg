// Archivo derivado por `drizzle-kit pull` (introspección de PostgreSQL).
// PostgreSQL es la autoridad del esquema; NO usar este archivo para
// `drizzle-kit generate` / `migrate`.
//
// Cambios manuales auditados (drizzle-kit 0.31.10 introspecta mal las
// restricciones compuestas):
//   - se elimina el `import { sql }` no utilizado (choca con noUnusedLocals);
//   - fk_users_company_role: foreignColumns corregido a [roles.companyId, roles.id]
//     (PostgreSQL: FOREIGN KEY (company_id, role_id) REFERENCES roles(company_id, id));
//   - uq_roles_company_role_id: .on(table.companyId, table.id)
//     (PostgreSQL: UNIQUE (company_id, id)).
// Cualquier otro cambio de tablas/columnas/tipos: regenerar con
// `pnpm exec drizzle-kit pull` y volver a auditar esas dos restricciones.
import { pgTable, unique, uuid, varchar, timestamp, integer, foreignKey, text, index, date, numeric, boolean, primaryKey } from "drizzle-orm/pg-core"



export const platformAdmins = pgTable("platform_admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar(),
	password: varchar({ length: 255 }),
	fullName: varchar("full_name"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	state: integer(),
}, (table) => [
	unique("platform_admins_email_key").on(table.email),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	legalName: text("legal_name"),
	currency: varchar({ length: 3 }),
	timezone: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	logoPath: text("logo_path"),
	primaryColor: text("primary_color"),
	secondaryColor: text("secondary_color"),
	accentColor: text("accent_color"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [platformAdmins.id],
			name: "companies_created_by_fkey"
		}),
]);

export const roles = pgTable("roles", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: uuid("company_id").notNull(),
	name: varchar().notNull(),
	description: varchar(),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "roles_company_id_fkey"
		}),
	// Corrección manual auditada: drizzle-kit 0.31.10 lo introspecta como
	// .on(table.id, table.companyId). PostgreSQL real: UNIQUE (company_id, id).
	unique("uq_roles_company_role_id").on(table.companyId, table.id),
	unique("uq_roles_company_name").on(table.companyId, table.name),
]);

export const modules = pgTable("modules", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "modules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar(),
	description: varchar(),
	state: integer(),
}, (table) => [
	unique("modules_name_key").on(table.name),
]);

export const permissions = pgTable("permissions", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	moduleId: integer("module_id"),
	action: varchar(),
	code: varchar(),
	description: varchar(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: "permissions_module_id_fkey"
		}),
	unique("permissions_code_key").on(table.code),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	username: varchar().notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	roleId: integer("role_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	state: integer().default(1).notNull(),
}, (table) => [
	foreignKey({
			// Corrección manual auditada: drizzle-kit 0.31.10 introspecta
			// foreignColumns como [roles.id, roles.companyId]. PostgreSQL real:
			// FOREIGN KEY (company_id, role_id) REFERENCES roles(company_id, id).
			columns: [table.companyId, table.roleId],
			foreignColumns: [roles.companyId, roles.id],
			name: "fk_users_company_role"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "users_company_id_fkey"
		}),
	unique("uq_users_company_username").on(table.companyId, table.username),
]);

export const clients = pgTable("clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	documentNumber: varchar("document_number", { length: 50 }).notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 150 }),
	emergencyContactName: varchar("emergency_contact_name", { length: 150 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }),
	bloodType: varchar("blood_type", { length: 5 }),
	birthDate: date("birth_date"),
	medicalCondition: text("medical_condition"),
	comments: text(),
	state: integer().default(1).notNull(),
	registeredAt: date("registered_at").notNull(),
	retiredAt: timestamp("retired_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_clients_company_fullname").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.fullName.asc().nullsLast().op("uuid_ops")),
	index("idx_clients_company_state").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.state.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "clients_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "clients_created_by_fkey"
		}),
	unique("uq_clients_company_document").on(table.companyId, table.documentNumber),
]);

export const clientNotes = pgTable("client_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientId: uuid("client_id").notNull(),
	note: text().notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_client_notes_client_created").using("btree", table.clientId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_notes_client_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "client_notes_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "client_notes_created_by_fkey"
		}),
]);

export const membershipTypes = pgTable("membership_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	description: text(),
	durationValue: integer("duration_value").notNull(),
	durationUnit: varchar("duration_unit", { length: 20 }).notNull(),
	minimumPayment: numeric("minimum_payment", { precision: 12, scale:  2 }),
	trainerShare: numeric("trainer_share", { precision: 12, scale:  2 }),
	businessShare: numeric("business_share", { precision: 12, scale:  2 }),
	allowsPartialPayment: boolean("allows_partial_payment").default(false).notNull(),
	isPromotional: boolean("is_promotional").default(false).notNull(),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "membership_types_company_id_fkey"
		}),
	unique("uq_membership_types_company_name").on(table.companyId, table.name),
]);

export const trainers = pgTable("trainers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
	documentNumber: varchar("document_number", { length: 50 }).notNull(),
	phone: varchar({ length: 30 }),
	hiredAt: date("hired_at"),
	salary: numeric({ precision: 12, scale:  2 }),
	maxClients: integer("max_clients"),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trainers_company_state").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.state.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "trainers_company_id_fkey"
		}),
	unique("uq_trainers_company_document").on(table.companyId, table.documentNumber),
]);

export const promotionGroups = pgTable("promotion_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_promotion_groups_company_name").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "promotion_groups_company_id_fkey"
		}),
]);

export const clientMemberships = pgTable("client_memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientId: uuid("client_id").notNull(),
	membershipTypeId: uuid("membership_type_id").notNull(),
	trainerId: uuid("trainer_id"),
	promotionGroupId: uuid("promotion_group_id"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	agreedPrice: numeric("agreed_price", { precision: 12, scale:  2 }).notNull(),
	state: integer().default(1).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_client_memberships_client_start").using("btree", table.clientId.asc().nullsLast().op("date_ops"), table.startDate.asc().nullsLast().op("date_ops")),
	index("idx_client_memberships_company_end").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("uuid_ops")),
	index("idx_client_memberships_company_state").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.state.asc().nullsLast().op("int4_ops")),
	index("idx_client_memberships_promo_group").using("btree", table.promotionGroupId.asc().nullsLast().op("uuid_ops")),
	index("idx_client_memberships_trainer_state").using("btree", table.trainerId.asc().nullsLast().op("uuid_ops"), table.state.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_memberships_client_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "client_memberships_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "client_memberships_created_by_fkey"
		}),
	foreignKey({
			columns: [table.membershipTypeId],
			foreignColumns: [membershipTypes.id],
			name: "client_memberships_membership_type_id_fkey"
		}),
	foreignKey({
			columns: [table.promotionGroupId],
			foreignColumns: [promotionGroups.id],
			name: "client_memberships_promotion_group_id_fkey"
		}),
	foreignKey({
			columns: [table.trainerId],
			foreignColumns: [trainers.id],
			name: "client_memberships_trainer_id_fkey"
		}),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientMembershipId: uuid("client_membership_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	paymentType: varchar("payment_type", { length: 20 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
	balanceAfter: numeric("balance_after", { precision: 12, scale:  2 }).notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }).notNull(),
	notes: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payments_company_paid").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.paidAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_payments_membership_paid").using("btree", table.clientMembershipId.asc().nullsLast().op("uuid_ops"), table.paidAt.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientMembershipId],
			foreignColumns: [clientMemberships.id],
			name: "payments_client_membership_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "payments_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "payments_created_by_fkey"
		}),
]);

export const trainerCommissions = pgTable("trainer_commissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	trainerId: uuid("trainer_id").notNull(),
	clientMembershipId: uuid("client_membership_id").notNull(),
	paymentId: uuid("payment_id").notNull(),
	trainerAmount: numeric("trainer_amount", { precision: 12, scale:  2 }).notNull(),
	businessAmount: numeric("business_amount", { precision: 12, scale:  2 }).notNull(),
	commissionDate: date("commission_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trainer_commissions_company_date").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.commissionDate.asc().nullsLast().op("uuid_ops")),
	index("idx_trainer_commissions_trainer_date").using("btree", table.trainerId.asc().nullsLast().op("date_ops"), table.commissionDate.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientMembershipId],
			foreignColumns: [clientMemberships.id],
			name: "trainer_commissions_client_membership_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "trainer_commissions_company_id_fkey"
		}),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "trainer_commissions_payment_id_fkey"
		}),
	foreignKey({
			columns: [table.trainerId],
			foreignColumns: [trainers.id],
			name: "trainer_commissions_trainer_id_fkey"
		}),
	unique("trainer_commissions_payment_id_key").on(table.paymentId),
]);

export const expenseCategories = pgTable("expense_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "expense_categories_company_id_fkey"
		}),
	unique("uq_expense_categories_company_name").on(table.companyId, table.name),
]);

export const expenses = pgTable("expenses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	concept: varchar({ length: 200 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	expenseDate: date("expense_date").notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_expenses_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_expenses_company_date").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.expenseDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [expenseCategories.id],
			name: "expenses_category_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "expenses_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "expenses_created_by_fkey"
		}),
]);

export const inventoryItems = pgTable("inventory_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	unitOfMeasure: varchar("unit_of_measure", { length: 30 }).notNull(),
	currentStock: numeric("current_stock", { precision: 12, scale:  3 }).default('0').notNull(),
	minimumStock: numeric("minimum_stock", { precision: 12, scale:  3 }).default('0').notNull(),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_inventory_items_company_state").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.state.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "inventory_items_company_id_fkey"
		}),
	unique("uq_inventory_items_company_name").on(table.companyId, table.name),
]);

export const inventoryMovements = pgTable("inventory_movements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	inventoryItemId: uuid("inventory_item_id").notNull(),
	movementType: varchar("movement_type", { length: 20 }).notNull(),
	quantity: numeric({ precision: 12, scale:  3 }).notNull(),
	previousStock: numeric("previous_stock", { precision: 12, scale:  3 }),
	resultingStock: numeric("resulting_stock", { precision: 12, scale:  3 }),
	reason: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_inventory_movements_company_created").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_inventory_movements_item_created").using("btree", table.inventoryItemId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "inventory_movements_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "inventory_movements_created_by_fkey"
		}),
	foreignKey({
			columns: [table.inventoryItemId],
			foreignColumns: [inventoryItems.id],
			name: "inventory_movements_inventory_item_id_fkey"
		}),
]);

export const equipmentMaintenance = pgTable("equipment_maintenance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	inventoryItemId: uuid("inventory_item_id").notNull(),
	scheduledDate: date("scheduled_date").notNull(),
	completedDate: date("completed_date"),
	description: text(),
	state: integer().default(1).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_equipment_maintenance_company_state").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.state.asc().nullsLast().op("uuid_ops")),
	index("idx_equipment_maintenance_item_scheduled").using("btree", table.inventoryItemId.asc().nullsLast().op("uuid_ops"), table.scheduledDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "equipment_maintenance_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "equipment_maintenance_created_by_fkey"
		}),
	foreignKey({
			columns: [table.inventoryItemId],
			foreignColumns: [inventoryItems.id],
			name: "equipment_maintenance_inventory_item_id_fkey"
		}),
]);

export const dailyLogs = pgTable("daily_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	logDate: date("log_date").notNull(),
	observations: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "daily_logs_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "daily_logs_created_by_fkey"
		}),
	unique("uq_daily_logs_company_date").on(table.companyId, table.logDate),
]);

export const monthlyClosures = pgTable("monthly_closures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	observations: text(),
	closedBy: uuid("closed_by"),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.closedBy],
			foreignColumns: [users.id],
			name: "monthly_closures_closed_by_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "monthly_closures_company_id_fkey"
		}),
	unique("uq_monthly_closures_company_year_month").on(table.companyId, table.year, table.month),
]);

export const attendances = pgTable("attendances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientId: uuid("client_id").notNull(),
	checkIn: timestamp("check_in", { withTimezone: true, mode: 'string' }).notNull(),
	checkOut: timestamp("check_out", { withTimezone: true, mode: 'string' }),
	source: varchar({ length: 20 }).default('manual').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_attendances_client_checkin").using("btree", table.clientId.asc().nullsLast().op("timestamptz_ops"), table.checkIn.asc().nullsLast().op("timestamptz_ops")),
	index("idx_attendances_company_checkin").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.checkIn.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "attendances_client_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "attendances_company_id_fkey"
		}),
]);

export const clientBiometrics = pgTable("client_biometrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientId: uuid("client_id").notNull(),
	externalReference: varchar("external_reference", { length: 150 }),
	provider: varchar({ length: 50 }),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_client_biometrics_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_biometrics_client_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "client_biometrics_company_id_fkey"
		}),
	unique("uq_client_biometrics_company_provider_ref").on(table.companyId, table.externalReference, table.provider),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	userId: uuid("user_id"),
	action: varchar({ length: 50 }).notNull(),
	module: varchar({ length: 50 }),
	entity: varchar({ length: 50 }),
	entityId: varchar("entity_id", { length: 64 }),
	detail: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_company_created").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_logs_entity").using("btree", table.entity.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("idx_audit_logs_user_created").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "audit_logs_company_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_fkey"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	clientId: uuid("client_id").notNull(),
	type: varchar({ length: 30 }).notNull(),
	channel: varchar({ length: 20 }).notNull(),
	message: text(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	state: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_client_scheduled").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.scheduledAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notifications_company_state").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.state.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "notifications_client_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "notifications_company_id_fkey"
		}),
]);

export const rolePermissions = pgTable("role_permissions", {
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
	grantedAt: timestamp("granted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_fkey"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_fkey"
		}),
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_pkey"}),
]);

export const promotionGroupMembers = pgTable("promotion_group_members", {
	promotionGroupId: uuid("promotion_group_id").notNull(),
	clientId: uuid("client_id").notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_promotion_group_members_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "promotion_group_members_client_id_fkey"
		}),
	foreignKey({
			columns: [table.promotionGroupId],
			foreignColumns: [promotionGroups.id],
			name: "promotion_group_members_promotion_group_id_fkey"
		}),
	primaryKey({ columns: [table.promotionGroupId, table.clientId], name: "promotion_group_members_pkey"}),
]);

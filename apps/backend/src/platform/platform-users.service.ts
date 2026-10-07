import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

// Value import: constructor-injected (see the note in access-token.guard.ts).
import { PasswordHasherService } from '../auth/password-hasher.service.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database, DatabaseTransaction } from '../database/database.types.js';
import { companies, roles, users } from '../database/schema/schema.js';
import { pgErrorCode, PG_UNIQUE_VIOLATION } from '../shared/pg-error.util.js';
import { temporaryPassword } from '../shared/temporary-password.js';

import type { IssuedCredential } from './platform-companies.types.js';
import { leavesNoAdministrator, normalizeUsername, usernameProblem } from './platform-user.rules.js';
import type {
  CreatePlatformUserDto,
  PlatformRoleRow,
  PlatformUserRow,
  UpdatePlatformUserDto,
} from './platform-users.types.js';

const USER_NOT_FOUND = 'El usuario no existe en este gimnasio.';
const STATE_ACTIVE = 1;
const STATE_INACTIVE = 2;

type Executor = Database | DatabaseTransaction;

/**
 * Usuarios de un gimnasio, administrados desde el panel. Todo se escribe con
 * el `company_id` del gimnasio: un usuario creado aquí entra solo por la
 * página de ese gimnasio, y en cuanto se crea.
 */
@Injectable()
export class PlatformUsersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly hasher: PasswordHasherService,
  ) {}

  async list(companyId: string): Promise<PlatformUserRow[]> {
    await this.assertCompany(companyId);
    return this.readUsers(this.db, companyId);
  }

  private async readUsers(db: Executor, companyId: string): Promise<PlatformUserRow[]> {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        roleId: users.roleId,
        roleName: roles.name,
        state: users.state,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(roles, and(eq(roles.id, users.roleId), eq(roles.companyId, users.companyId)))
      .where(eq(users.companyId, companyId))
      .orderBy(asc(users.createdAt));
    return rows.map(({ state, ...row }) => ({ ...row, active: state === STATE_ACTIVE }));
  }

  async roles(companyId: string): Promise<PlatformRoleRow[]> {
    await this.assertCompany(companyId);
    return this.db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(and(eq(roles.companyId, companyId), eq(roles.state, 1)))
      .orderBy(asc(roles.id));
  }

  /** Devuelve la contraseña inicial: se muestra una vez y no se guarda en claro. */
  async create(
    companyId: string,
    input: CreatePlatformUserDto,
  ): Promise<{ user: PlatformUserRow; credential: IssuedCredential }> {
    const username = normalizeUsername(input.username);
    const problem = usernameProblem(username);
    if (problem) throw new BadRequestException(problem);
    // @MinLength runs before trim: "   " would pass it and store an empty name.
    const fullName = input.fullName.trim();
    if (fullName.length < 2) throw new BadRequestException('Escribe el nombre completo.');
    await this.roleOf(companyId, input.roleId);

    const password = temporaryPassword();
    try {
      const [created] = await this.db
        .insert(users)
        .values({
          companyId,
          username,
          fullName,
          password: await this.hasher.hash(password),
          roleId: input.roleId,
          state: STATE_ACTIVE,
        })
        .returning({ id: users.id });
      const user = (await this.list(companyId)).find((row) => row.id === created?.id);
      if (!user) throw new Error('INSERT into users did not return a readable row.');
      return { user, credential: { username, password } };
    } catch (error) {
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`Ya existe el usuario "${username}" en este gimnasio.`);
      }
      throw error;
    }
  }

  async update(companyId: string, userId: string, change: UpdatePlatformUserDto): Promise<void> {
    if (change.roleId === undefined && change.active === undefined) {
      throw new BadRequestException('Nada que cambiar: indica el perfil o si está activo.');
    }
    const role = change.roleId === undefined ? undefined : await this.roleOf(companyId, change.roleId);

    await this.db.transaction(async (tx) => {
      // One change to a gym's users at a time: two requests at once could each
      // see the other administrator still active and both step down.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${companyId}))`);
      const current = await this.readUsers(tx, companyId);
      if (!current.some((user) => user.id === userId)) throw new NotFoundException(USER_NOT_FOUND);
      const standings = current.map(({ id, roleName, active }) => ({ id, roleName, active }));
      if (leavesNoAdministrator(standings, { userId, roleName: role?.name, active: change.active })) {
        throw new ConflictException('Debe quedar al menos un administrador activo en el gimnasio.');
      }
      await tx
        .update(users)
        .set({
          ...(role ? { roleId: role.id } : {}),
          ...(change.active === undefined ? {} : { state: change.active ? STATE_ACTIVE : STATE_INACTIVE }),
        })
        .where(and(eq(users.id, userId), eq(users.companyId, companyId)));
    });
  }

  async resetPassword(companyId: string, userId: string): Promise<IssuedCredential> {
    const user = (await this.list(companyId)).find((row) => row.id === userId);
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    const password = temporaryPassword();
    await this.db
      .update(users)
      .set({ password: await this.hasher.hash(password) })
      .where(and(eq(users.id, userId), eq(users.companyId, companyId)));
    return { username: user.username, password };
  }

  private async roleOf(companyId: string, roleId: number): Promise<PlatformRoleRow> {
    const role = (await this.roles(companyId)).find((row) => row.id === roleId);
    if (!role) throw new BadRequestException('Ese perfil no existe en este gimnasio.');
    return role;
  }

  private async assertCompany(companyId: string): Promise<void> {
    const [company] = await this.db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId));
    if (!company) throw new NotFoundException('Gimnasio no encontrado.');
  }
}

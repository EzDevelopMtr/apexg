import { Inject, Injectable, Logger } from '@nestjs/common';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { auditLogs } from '../database/schema/schema.js';

export type PlatformAction =
  | 'company.create'
  | 'company.update'
  | 'company.brand'
  | 'user.create'
  | 'user.update'
  | 'user.password';

/** Qué hizo el super admin, sobre qué gimnasio. Reutiliza `audit_logs` (022). */
@Injectable()
export class PlatformAuditService {
  private readonly logger = new Logger(PlatformAuditService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async record(
    platformAdminId: string,
    action: PlatformAction,
    companyId: string,
    detail?: Record<string, unknown>,
  ): Promise<void> {
    // Runs after the change is done. Failing here must not turn a done change
    // into an error: a reset password would be lost (new hash saved, never
    // shown) and a created user retried into a 409. Logged instead.
    try {
      await this.db.insert(auditLogs).values({
        platformAdminId,
        companyId,
        action,
        module: 'platform',
        entity: 'company',
        entityId: companyId,
        detail: detail ? JSON.stringify(detail) : null,
      });
    } catch (error) {
      this.logger.error(`No se pudo auditar ${action} en ${companyId}`, error instanceof Error ? error.stack : String(error));
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { auditLogs } from '../database/schema/schema.js';

export type PlatformAction =
  | 'company.create'
  | 'company.update'
  | 'company.brand'
  | 'company.admin-password';

/** Qué hizo el super admin, sobre qué gimnasio. Reutiliza `audit_logs` (022). */
@Injectable()
export class PlatformAuditService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async record(
    platformAdminId: string,
    action: PlatformAction,
    companyId: string,
    detail?: Record<string, unknown>,
  ): Promise<void> {
    await this.db.insert(auditLogs).values({
      platformAdminId,
      companyId,
      action,
      module: 'platform',
      entity: 'company',
      entityId: companyId,
      detail: detail ? JSON.stringify(detail) : null,
    });
  }
}

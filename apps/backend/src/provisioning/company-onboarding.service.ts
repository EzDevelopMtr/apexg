import { ConflictException, Inject, Injectable } from '@nestjs/common';

import type {
  CreateInitialAdministratorInput,
  CreateInitialAdministratorResult,
} from '../auth/auth.types.js';
// Value import: constructor-injected (see the note in access-token.guard.ts).
import { InitialAdministratorService } from '../auth/initial-administrator.service.js';
import { DATABASE } from '../database/database.constants.js';
import type { Database } from '../database/database.types.js';
import { pgErrorCode, PG_UNIQUE_VIOLATION } from '../shared/pg-error.util.js';

// Value import: constructor-injected (see the note in access-token.guard.ts).
import { CompanyProvisioningService } from './company-provisioning.service.js';
import type {
  ProvisionCompanyInput,
  ProvisionCompanyResult,
} from './company-provisioning.types.js';

export interface OnboardCompanyInput {
  company: ProvisionCompanyInput;
  administrator: Omit<CreateInitialAdministratorInput, 'companyId'>;
}

export interface OnboardCompanyResult {
  company: ProvisionCompanyResult;
  administrator: CreateInitialAdministratorResult;
}

/**
 * Alta de un gimnasio listo para usar: la empresa con su configuración base y
 * su primer Administrador, en UNA transacción. Si el administrador no se puede
 * crear, tampoco queda la empresa: un gimnasio sin nadie que pueda entrar
 * solo se arreglaría a mano en la base.
 */
@Injectable()
export class CompanyOnboardingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly provisioning: CompanyProvisioningService,
    private readonly administrators: InitialAdministratorService,
  ) {}

  async onboard(input: OnboardCompanyInput): Promise<OnboardCompanyResult> {
    try {
      return await this.db.transaction(async (tx) => {
        const company = await this.provisioning.provisionIn(tx, input.company);
        const administrator = await this.administrators.createIn(tx, {
          ...input.administrator,
          companyId: company.companyId,
        });
        return { company, administrator };
      });
    } catch (error) {
      // El único UNIQUE que puede chocar en una empresa nueva es su slug.
      if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `Ya existe un gimnasio con el identificador "${input.company.slug}".`,
        );
      }
      throw error;
    }
  }
}

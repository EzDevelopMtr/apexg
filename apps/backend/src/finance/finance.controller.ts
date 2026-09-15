import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

// Value imports: DI (FinanceService) and @Body()/@Query() DTOs need the
// real class at runtime (see the note in access-token.guard.ts).
import { BalanceQueryDto } from './balance-query.dto.js';
import { CreateMonthlyClosureDto } from './create-monthly-closure.dto.js';
import { FinanceService } from './finance.service.js';
import type {
  BalanceSummary,
  FinanceDashboard,
  MonthlyClosureResult,
  MonthlySummary,
} from './finance.types.js';
import { MonthlySummaryQueryDto } from './monthly-summary-query.dto.js';

/** RF-31 a RF-33, RF-35. Todo bajo `finanzas.read` — el catálogo de
 *  permisos no define `finanzas.create`/`update` (ver create-monthly-closure.dto.ts). */
@Controller('finance')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('balance')
  @RequirePermissions('finanzas.read')
  getBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BalanceQueryDto,
  ): Promise<BalanceSummary> {
    return this.finance.getBalance(user.companyId, query.from, query.to);
  }

  @Get('monthly-summary')
  @RequirePermissions('finanzas.read')
  getMonthlySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MonthlySummaryQueryDto,
  ): Promise<MonthlySummary> {
    return this.finance.getMonthlySummary(user.companyId, query.year, query.month);
  }

  @Get('dashboard')
  @RequirePermissions('finanzas.read')
  getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<FinanceDashboard> {
    return this.finance.getDashboard(user.companyId);
  }

  @Get('monthly-closures')
  @RequirePermissions('finanzas.read')
  listClosures(@CurrentUser() user: AuthenticatedUser): Promise<MonthlyClosureResult[]> {
    return this.finance.listClosures(user.companyId);
  }

  @Post('monthly-closures')
  @RequirePermissions('finanzas.read')
  closeMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMonthlyClosureDto,
  ): Promise<MonthlyClosureResult> {
    return this.finance.closeMonth(user.companyId, user.id, dto);
  }
}

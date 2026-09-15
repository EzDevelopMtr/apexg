import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { today } from '../shared/date.util.js';

// Value imports: DI (DailyLogService) and @Body()/@Query() DTOs need the
// real class at runtime (see the note in access-token.guard.ts).
import { CreateDailyLogDto } from './create-daily-log.dto.js';
import { DailyLogQueryDto } from './daily-log-query.dto.js';
import { DailyLogService } from './daily-log.service.js';
import type { DailyLogSummary } from './daily-log.types.js';
import { UpdateDailyLogDto } from './update-daily-log.dto.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** RF-34. */
@Controller('daily-log')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class DailyLogController {
  constructor(private readonly dailyLog: DailyLogService) {}

  @Get()
  @RequirePermissions('apartado_diario.read')
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DailyLogQueryDto,
  ): Promise<DailyLogSummary> {
    return this.dailyLog.getSummary(user.companyId, query.date ?? today());
  }

  @Post()
  @RequirePermissions('apartado_diario.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDailyLogDto,
  ): Promise<DailyLogSummary> {
    return this.dailyLog.create(user.companyId, user.id, dto);
  }

  @Patch(':date')
  @RequirePermissions('apartado_diario.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
    @Body() dto: UpdateDailyLogDto,
  ): Promise<DailyLogSummary> {
    if (!ISO_DATE_PATTERN.test(date)) {
      throw new BadRequestException('date debe tener el formato YYYY-MM-DD.');
    }
    return this.dailyLog.update(user.companyId, date, dto);
  }
}

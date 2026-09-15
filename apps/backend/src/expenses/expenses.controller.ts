import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

// Value imports: DI (ExpensesService, ExpenseCategoryService) and
// @Body()/@Query() DTOs need the real class at runtime (see the note in
// access-token.guard.ts).
import { CreateExpenseCategoryDto } from './create-expense-category.dto.js';
import { CreateExpenseDto } from './create-expense.dto.js';
import { ExpenseCategoryService } from './expense-category.service.js';
import { ExpensesService } from './expenses.service.js';
import type { ExpenseCategoryResult, ExpenseResult } from './expenses.types.js';
import { ListExpensesQueryDto } from './list-expenses-query.dto.js';
import { UpdateExpenseCategoryDto } from './update-expense-category.dto.js';
import { UpdateExpenseDto } from './update-expense.dto.js';

/** RF-26, RF-27. Categorías y egresos comparten los mismos permisos `egresos.*`. */
@Controller()
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly categories: ExpenseCategoryService,
  ) {}

  @Post('expense-categories')
  @RequirePermissions('egresos.create')
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResult> {
    return this.categories.create(user.companyId, dto);
  }

  @Get('expense-categories')
  @RequirePermissions('egresos.read')
  listCategories(@CurrentUser() user: AuthenticatedUser): Promise<ExpenseCategoryResult[]> {
    return this.categories.list(user.companyId);
  }

  @Patch('expense-categories/:id')
  @RequirePermissions('egresos.update')
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResult> {
    return this.categories.update(user.companyId, id, dto);
  }

  @Delete('expense-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('egresos.delete')
  async removeCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.categories.remove(user.companyId, id);
  }

  @Post('expenses')
  @RequirePermissions('egresos.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResult> {
    return this.expenses.create(user.companyId, user.id, dto);
  }

  @Get('expenses')
  @RequirePermissions('egresos.read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListExpensesQueryDto,
  ): Promise<ExpenseResult[]> {
    return this.expenses.findAll(user.companyId, {
      categoryId: query.categoryId,
      from: query.from,
      to: query.to,
    });
  }

  @Get('expenses/:id')
  @RequirePermissions('egresos.read')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseResult> {
    return this.expenses.findOne(user.companyId, id);
  }

  @Patch('expenses/:id')
  @RequirePermissions('egresos.update')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResult> {
    return this.expenses.update(user.companyId, id, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('egresos.delete')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.expenses.remove(user.companyId, id);
  }
}

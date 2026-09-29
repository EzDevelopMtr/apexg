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
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { PaymentReceiptService } from '../payments/payment-receipt.service.js';
import type { UploadedFile as Upload } from '../shared/local-file-store.js';

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

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/**
 * RF-26, RF-27. Categorías y egresos comparten los mismos permisos `egresos.*`.
 * El comprobante de un egreso sigue la regla y el almacén de un pago (RNF-07).
 */
@Controller()
@UseGuards(AccessTokenGuard, PermissionGuard)
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly categories: ExpenseCategoryService,
    private readonly receipts: PaymentReceiptService,
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
  @UseInterceptors(FileInterceptor('receipt', { limits: { fileSize: MAX_RECEIPT_BYTES } }))
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() receipt?: Upload,
  ): Promise<ExpenseResult> {
    const receiptPath = await this.receipts.storeFor(dto.paymentMethod, receipt);
    try {
      return await this.expenses.create(user.companyId, user.id, dto, receiptPath);
    } catch (error) {
      if (receiptPath) await this.receipts.discard(receiptPath);
      throw error;
    }
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

  @Get('expenses/:id/receipt')
  @RequirePermissions('egresos.read')
  async findReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const expense = await this.expenses.findOne(user.companyId, id);
    const { stream, contentType } = this.receipts.openReceipt(expense.receiptPath ?? '');
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(stream);
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
    const receiptPath = await this.expenses.remove(user.companyId, id);
    // Después de borrar la fila: si el DELETE falla, el comprobante sigue ahí.
    if (receiptPath) await this.receipts.discard(receiptPath);
  }
}

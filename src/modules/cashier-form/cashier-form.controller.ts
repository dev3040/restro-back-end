import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CashierFormService } from './cashier-form.service';
import { CreateCashierFormDto } from './dto/create-cashier-form.dto';
import { UpdateCashierFormDto } from './dto/update-cashier-form.dto';
import { FindByDateDto } from './dto/find-by-date.dto';
import { CashierForm } from '../../shared/entity/cashier-form.entity';
import { Response } from 'express';

@ApiTags('Cashier Form')
@Controller('cashier-form')
export class CashierFormController {
  constructor(private readonly cashierFormService: CashierFormService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new cashier form' })
  @ApiResponse({ status: 201, description: 'Cashier form created successfully', type: CashierForm })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCashierFormDto: CreateCashierFormDto): Promise<CashierForm> {
    return this.cashierFormService.create(createCashierFormDto);
  }

  @Post('pdf')
  async generatePdf(@Body() data: any, @Res() res: Response) {
    const pdfBuffer = await this.cashierFormService.generatePdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cashier-form.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cashier forms or filter by date' })
  @ApiQuery({ name: 'date', required: false, description: 'Specific date to filter by (ISO date string)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (ISO date string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (ISO date string)' })
  @ApiResponse({ status: 200, description: 'List of cashier forms', type: [CashierForm] })
  findAll(@Query() query: FindByDateDto): Promise<CashierForm[]> {
    // If any date query parameters are provided, use findByDate
    if (query.date || query.startDate || query.endDate) {
      return this.cashierFormService.findByDate(query);
    }
    // Otherwise, return all forms
    return this.cashierFormService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cashier form by ID' })
  @ApiParam({ name: 'id', description: 'Cashier form ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cashier form found', type: CashierForm })
  @ApiResponse({ status: 404, description: 'Cashier form not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CashierForm> {
    return this.cashierFormService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cashier form' })
  @ApiParam({ name: 'id', description: 'Cashier form ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cashier form updated successfully', type: CashierForm })
  @ApiResponse({ status: 404, description: 'Cashier form not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCashierFormDto: UpdateCashierFormDto,
  ): Promise<CashierForm> {
    return this.cashierFormService.update(id, updateCashierFormDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cashier form' })
  @ApiParam({ name: 'id', description: 'Cashier form ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cashier form deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cashier form not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cashierFormService.remove(id);
  }



} 
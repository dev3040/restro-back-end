import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags
} from '@nestjs/swagger';
import { GetUser } from './decorator/get-user.decorator';
import { User } from '../../shared/entity/user.entity';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Billing } from '../../shared/entity/billing.entity';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from '../../shared/entity/payment.entity';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class BillingController {
    constructor(private billingService: BillingService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new bill' })
    @ApiResponse({
        status: 201,
        description: 'Bill created successfully',
        type: Billing
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async createBill(
        @Body() createBillingDto: CreateBillingDto,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.billingService.createBill(createBillingDto, user.id);
    }

    @Get('final-report')
    @ApiOperation({ summary: 'Get final analysis report as PDF' })
    @ApiResponse({ status: 200, description: 'PDF report generated' })
    async getFinalReport(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('isHalfDay') isHalfDay: string,
        @Res() res: any,
        @GetUser() user: User,
    ) {
        const pdfBuffer = await this.billingService.generateFinalReportPdf({
            from,
            to,
            isHalfDay: isHalfDay === 'true',
            branchId: user.branchId
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="final_report.pdf"`);
        res.end(pdfBuffer);
    }

    @Get('mode-wise-report')
    @ApiOperation({ summary: 'Get sale report mode wise as PDF' })
    @ApiResponse({ status: 200, description: 'PDF report generated' })
    async getModeWiseReport(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('isHalfDay') isHalfDay: string,
        @Res() res: any,
        @GetUser() user: User,
    ) {
        const pdfBuffer = await this.billingService.generateModeWiseReportPdf({
            from,
            to,
            isHalfDay: isHalfDay === 'true',
            branchId: user.branchId
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="mode_wise_report.pdf"`);
        res.end(pdfBuffer);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a bill by ID' })
    @ApiParam({ name: 'id', description: 'Bill ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Bill retrieved successfully',
        type: Billing
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Bill not found' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getBillById(@Param('id') id: number): Promise<Billing> {
        return this.billingService.getBillById(id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all bills with optional date and payment status filters' })
    @ApiResponse({
        status: 200,
        description: 'Bills retrieved successfully',
        type: [Billing]
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getAllBills(
        @GetUser() user: User,
        @Query('date') date?: string,
        @Query('branchId') branchId?: number,
        @Query('isPendingPayment') isPendingPayment?: boolean,
        @Query('isVoid') isVoid?: boolean,
    ): Promise<AppResponse> {
        return this.billingService.getAllBills(user, date, isPendingPayment, isVoid, branchId);
    }

    @Get(':id/pdf')
    async getBillPdfById(@Param('id') id: number, @Res() res: any) {
        const bill = await this.billingService.getBillById(id);
        if (!bill) {
            return res.status(404).send('Bill not found');
        }
        const pdfBuffer = await this.billingService.generateBillPdf(bill);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="bill_${bill.id}.pdf"`);
        res.end(pdfBuffer);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing bill' })
    @ApiParam({ name: 'id', description: 'Bill ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Bill updated successfully',
        type: Billing
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Bill not found' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async updateBill(
        @Param('id') id: number,
        @Body() updateBillingDto: CreateBillingDto,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.billingService.updateBill(id, updateBillingDto, user.id);
    }
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class PaymentsController {
    constructor(private paymentService: PaymentService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({
        status: 201,
        description: 'Payment created successfully',
        type: Payment
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async createPayment(
        @Body() createPaymentDto: CreatePaymentDto,
    ): Promise<AppResponse> {
        return this.paymentService.createPayment(createPaymentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all payments with optional date filter' })
    @ApiResponse({
        status: 200,
        description: 'Payments retrieved successfully',
        type: [Payment]
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getAllPayments(
        @GetUser() user: User,
        @Query('date') date?: string,
    ): Promise<AppResponse> {
        return this.paymentService.getAllPayments(user, date);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a payment by ID' })
    @ApiParam({ name: 'id', description: 'Payment ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Payment retrieved successfully',
        type: Payment
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async getPaymentById(@Param('id') id: number): Promise<Payment> {
        return this.paymentService.getPaymentById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing payment' })
    @ApiParam({ name: 'id', description: 'Payment ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Payment updated successfully',
        type: Payment
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async updatePayment(
        @Param('id') id: number,
        @Body() updatePaymentDto: CreatePaymentDto,
    ): Promise<AppResponse> {
        return this.paymentService.updatePayment(id, updatePaymentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a payment' })
    @ApiParam({ name: 'id', description: 'Payment ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Payment deleted successfully'
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async deletePayment(@Param('id') id: number): Promise<AppResponse> {
        return this.paymentService.deletePayment(id);
    }
}

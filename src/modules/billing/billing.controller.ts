import {
    Body,
    Controller,
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
        @Query('date') date?: string,
        @Query('isPendingPayment') isPendingPayment?: boolean
    ): Promise<AppResponse> {
        return this.billingService.getAllBills(date, isPendingPayment);
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
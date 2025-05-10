import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Billing } from '../../shared/entity/billing.entity';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { throwException } from 'src/shared/utility/throw-exception';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(BillingRepository)
        private billingRepository: BillingRepository,
    ) { }

    async createBill(createBillingDto: CreateBillingDto, userId: number): Promise<AppResponse> {
        try {
            const bill = await this.billingRepository.createBill(createBillingDto, userId);
            return {
                message: "SUC_BILLING_CREATED",
                data: bill
            };
        } catch (error) {
            throwException(error);
        }
        return
    }

    async getBillById(id: number): Promise<Billing> {
        return this.billingRepository.getBillById(id);
    }

    async getAllBills(date?: string): Promise<AppResponse> {
        return {
            message: "SUC_BILLING_LIST_FETCHED",
            data: await this.billingRepository.getAllBills(date)
        };
    }
} 
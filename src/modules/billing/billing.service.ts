import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Billing } from '../../shared/entity/billing.entity';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { throwException } from 'src/shared/utility/throw-exception';
import * as ejs from 'ejs';
import * as path from 'path';
import * as pdf from 'html-pdf-node';

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

    async getAllBills(date?: string, isPendingPayment?: boolean): Promise<AppResponse> {
        return {
            message: "SUC_BILLING_LIST_FETCHED",
            data: await this.billingRepository.getAllBills(date, isPendingPayment)
        };
    }

    async generateBillPdf(bill: any): Promise<Buffer> {
        // Always resolve from project root
        const templatePath = path.join(process.cwd(), 'src', 'shared', 'templates', 'bill.ejs');
        console.log("Billlllllllll:",bill?.branch?.address);
        const html = await ejs.renderFile(templatePath, { bill });

        const file = { content: html };
        const options = { 
            format: 'A4',
            encoding: 'UTF-8',
            border: {
                top: '10px',
                right: '10px',
                bottom: '10px',
                left: '10px'
            }
        };

        const pdfBuffer = await pdf.generatePdf(file, options);
        return pdfBuffer;
    }

    async updateBill(id: number, updateBillingDto: CreateBillingDto, userId: number): Promise<AppResponse> {
        try {
            const bill = await this.billingRepository.updateBill(id, updateBillingDto, userId);
            return {
                message: "SUC_BILLING_UPDATED",
                data: bill
            };
        } catch (error) {
            throwException(error);
        }
    }
} 
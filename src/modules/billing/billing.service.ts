import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingRepository } from './billing.repository';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Billing } from '../../shared/entity/billing.entity';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { throwException } from 'src/shared/utility/throw-exception';
import * as ejs from 'ejs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

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

    async getAllBills(user: any, date?: string, isPendingPayment?: boolean): Promise<AppResponse> {
        return {
            message: "SUC_BILLING_LIST_FETCHED",
            data: await this.billingRepository.getAllBills(date, isPendingPayment, user.branchId)
        };
    }

    async generateBillPdf(bill: any): Promise<Buffer> {
        try {
            // Always resolve from project root
            const templatePath = path.join(process.cwd(), 'src', 'shared', 'templates', 'bill.ejs');
            const html = await ejs.renderFile(templatePath, { bill });

            // Launch puppeteer
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            // Create a new page
            const page = await browser.newPage();

            // Set content
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10px',
                    right: '10px',
                    bottom: '10px',
                    left: '10px'
                }
            });

            // Close browser
            await browser.close();

            return Buffer.from(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
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
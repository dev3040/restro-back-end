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
import { Between } from 'typeorm';

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

    async generateFinalReportPdf({ from, to, isHalfDay }): Promise<Buffer> {
        try {
            // 1. Parse dates
            const fromDate = new Date(from);
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);

            // 2. If isHalfDay, set toDate to 12:00 PM
            if (isHalfDay) {
                toDate.setHours(12, 0, 0, 0);
            }

            // 3. Query bills for the user/branch in the date range
            const bills = await Billing.find({
                where: {
                    createdAt: Between(fromDate, toDate)
                }
            });

            console.log("bills", bills.length);

            // 4. Aggregate report data
            let taxableAmt = 0;
            let vatAmt = 0;
            let totalSales = 0;
            let homeDeliverySales = 0;
            let discounts = 0;
            let creditCardSales = 0;
            let talabatSales = 0;
            let noonSales = 0;
            let smilesSales = 0;
            let careemSales = 0;
            let deliverooSales = 0;
            let instashopSales = 0;
            let cashSales = 0;
            let totalPayments = 0; // You may want to fetch actual payments
            let totalCheque = 0;   // If you have cheque payments
            let zomotoSales = 0;

            bills.forEach(bill => {
                const amount = Number(bill.subTotal || 0);
                const slug = bill.paymentMethod?.slug;
                taxableAmt += Number(bill.billingCalc?.amountWithOutVat || 0);
                vatAmt += Number(bill.billingCalc?.vat || 0);
                totalSales += amount;
                discounts += Number(bill.discount || 0);
                if (bill.isHomeDelivery) homeDeliverySales += amount;
                if (slug === 'cash') cashSales += amount;
                if (slug === 'credit-card' || slug === 'credit-card-cash') creditCardSales += amount;
                if (slug === 'talabat') talabatSales += amount;
                if (slug === 'noon') noonSales += amount;
                if (slug === 'smiles') smilesSales += amount;
                if (slug === 'careem') careemSales += amount;
                if (slug === 'deliveroo') deliverooSales += amount;
                if (slug === 'instashop') instashopSales += amount;
                if (slug === 'cheque') totalCheque += amount;
            });

            // Calculate total after online sales (excluding all online platforms)
            const totalAfterOnline = totalSales - (
                creditCardSales + talabatSales + noonSales + smilesSales + careemSales + deliverooSales + instashopSales + zomotoSales
            );

            // Cash in hand (example calculation, adjust as needed)
            const cashInHand = totalAfterOnline - totalPayments;

            // 5. Render EJS template
            const reportData = {
                from,
                to,
                isHalfDay,
                taxableAmt,
                vatAmt,
                totalSales,
                homeDeliverySales,
                discounts,
                creditCardSales,
                talabatSales,
                noonSales,
                smilesSales,
                careemSales,
                deliverooSales,
                instashopSales,
                cashSales,
                totalAfterOnline,
                totalPayments,
                cashInHand,
                totalCheque,
                zomotoSales
            };

            const templatePath = path.join(process.cwd(), 'src', 'shared', 'templates', 'final-report.ejs');
            const html = await ejs.renderFile(templatePath, reportData);

            // 6. Generate PDF with puppeteer
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' }
            });
            await browser.close();
            return Buffer.from(pdfBuffer);
        } catch (error) {
            console.error('Error generating final report PDF:', error);
            throw error;
        }
    }
} 
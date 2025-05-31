import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../shared/entity/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
    ) { }

    async createPayment(createPaymentDto: CreatePaymentDto): Promise<AppResponse> {
        const payment = this.paymentRepository.create({
            ...createPaymentDto,
            paymentMode: 'cash'
        });
        const savedPayment = await this.paymentRepository.save(payment);
        return {
            message: 'Payment created successfully',
            data: savedPayment
        };
    }

    async getAllPayments(user: any, date?: string): Promise<AppResponse> {
        const whereClause: any = { branchId: user.branchId };
        
        if (date) {
            whereClause.paymentDate = date;
        }

        const payments = await this.paymentRepository.find({
            order: { paymentDate: 'DESC' },
            where: whereClause
        });
        
        return {
            message: 'Payments retrieved successfully',
            data: payments
        };
    }

    async getPaymentById(id: number): Promise<Payment> {
        const payment = await this.paymentRepository.findOne({ where: { id } });
        if (!payment) {
            throw new NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }

    async updatePayment(id: number, updatePaymentDto: CreatePaymentDto): Promise<AppResponse> {
        const payment = await this.getPaymentById(id);
        Object.assign(payment, {
            ...updatePaymentDto,
            paymentMode: 'cash'
        });
        const updatedPayment = await this.paymentRepository.save(payment);
        return {
            message: 'Payment updated successfully',
            data: updatedPayment
        };
    }

    async deletePayment(id: number): Promise<AppResponse> {
        const payment = await this.getPaymentById(id);
        await this.paymentRepository.remove(payment);
        return {
            message: 'Payment deleted successfully',
            data: null
        };
    }
} 
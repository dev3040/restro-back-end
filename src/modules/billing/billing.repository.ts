import { Repository, Between, DataSource } from 'typeorm';
import { Billing } from '../../shared/entity/billing.entity';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';

@Injectable()
export class BillingRepository extends Repository<Billing> {
    constructor(readonly dataSource: DataSource) {
        super(Billing, dataSource.createEntityManager());
    }

    async createBill(createBillingDto: CreateBillingDto, userId: number): Promise<any> {
        try {
            const {
                billingCalc,
                isTakeAway,
                isHomeDelivery,
                subTotal,
                discount,
                deliveryBoyId,
                branchId,
                paymentMethodId,
                tableNo
            } = createBillingDto;

            // Get the current date at midnight for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Find the last billing ID for today
            const lastBilling = await this.findOne({
                where: {
                    createdAt: Between(today, tomorrow)
                },
                order: {
                    billingId: 'DESC'
                }
            });

            // Generate new billing ID (reset daily)
            const billingId = lastBilling ? lastBilling.billingId + 1 : 1;

            const billing = new Billing();
            billing.billingId = billingId;
            billing.billingCalc = billingCalc;
            billing.isTakeAway = isTakeAway;
            billing.isHomeDelivery = isHomeDelivery;
            billing.subTotal = subTotal;
            billing.discount = discount;
            billing.deliveryBoyId = deliveryBoyId;
            billing.branch = { id: branchId } as any;
            billing.paymentMethodId = paymentMethodId;
            billing.tableNo = tableNo;
            billing.createdBy = userId;
            billing.updatedBy = userId;

            await billing.save();
            return billing;
        } catch (error) {
            throw new InternalServerErrorException('Failed to create billing');
        }
    }

    async getBillById(id: number): Promise<Billing> {
        try {
            const billing = await this.findOne({
                where: { id },
                relations: ['branch', 'paymentMethod']
            });

            if (!billing) {
                throw new NotFoundException(`Bill with ID ${id} not found`);
            }

            return billing;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get billing');
        }
    }
} 
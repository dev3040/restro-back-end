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
                tableNo,
                isPendingPayment,
                customerId,
                remarks
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
            let billingId = 1;
            if (lastBilling) {
                // Check if the last billing is from today by comparing dates only
                const lastBillingDate = new Date(lastBilling.createdAt);
                lastBillingDate.setHours(0, 0, 0, 0);
                
                // Compare only the date parts (year, month, day)
                if (lastBillingDate.getFullYear() === today.getFullYear() &&
                    lastBillingDate.getMonth() === today.getMonth() &&
                    lastBillingDate.getDate() === today.getDate()) {
                    billingId = lastBilling.billingId + 1;
                }
            }

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
            billing.isPendingPayment = isPendingPayment;
            billing.customerId = customerId;
            billing.remarks = remarks;
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
                relations: ['branch', 'paymentMethod', 'customer']
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

    async getAllBills(date?: string, isPendingPayment?: boolean, branchId?: number): Promise<Billing[]> {
        try {
            const queryBuilder = this.createQueryBuilder('billing')
                .leftJoinAndSelect('billing.branch', 'branch')
                .leftJoinAndSelect('billing.paymentMethod', 'paymentMethod')
                .where('billing.branchId = :branchId', { branchId });

            if (date) {
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);

                queryBuilder.andWhere('billing.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate
                });
            }

            if (isPendingPayment !== undefined) {
                queryBuilder.andWhere('billing.isPendingPayment = :isPendingPayment', {
                    isPendingPayment
                });
            }

            return await queryBuilder.getMany();
        } catch (error) {
            throw new InternalServerErrorException('Failed to get bills');
        }
    }

    async updateBill(id: number, updateBillingDto: CreateBillingDto, userId: number): Promise<Billing> {
        try {
            const bill = await this.getBillById(id);
            if (!bill) {
                throw new NotFoundException(`Bill with ID ${id} not found`);
            }

            const {
                billingCalc,
                isTakeAway,
                isHomeDelivery,
                subTotal,
                discount,
                deliveryBoyId,
                branchId,
                paymentMethodId,
                tableNo,
                isPendingPayment,
                customerId,
                remarks
            } = updateBillingDto;

            // Update bill properties
            if (billingCalc !== undefined) bill.billingCalc = billingCalc;
            if (isTakeAway !== undefined) bill.isTakeAway = isTakeAway;
            if (isHomeDelivery !== undefined) bill.isHomeDelivery = isHomeDelivery;
            if (subTotal !== undefined) bill.subTotal = subTotal;
            if (discount !== undefined) bill.discount = discount;
            if (deliveryBoyId !== undefined) bill.deliveryBoyId = deliveryBoyId;
            if (branchId !== undefined) bill.branch = { id: branchId } as any;
            if (paymentMethodId !== undefined) bill.paymentMethodId = paymentMethodId;
            if (tableNo !== undefined) bill.tableNo = tableNo;
            if (isPendingPayment !== undefined) bill.isPendingPayment = isPendingPayment;
            if (customerId !== undefined) bill.customerId = customerId;
            if (remarks !== undefined) bill.remarks = remarks;
            
            bill.updatedBy = userId;

            await bill.save();
            return bill;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update billing');
        }
    }
} 
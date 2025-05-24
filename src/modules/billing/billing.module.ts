import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BillingController, PaymentsController } from './billing.controller';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';
import { Billing } from '../../shared/entity/billing.entity';
import { Payment } from '../../shared/entity/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Billing, Payment]),
    AuthModule,
  ],
  controllers: [BillingController, PaymentsController],
  providers: [BillingService, PaymentService, BillingRepository],
  exports: [BillingService, PaymentService],
})
export class BillingModule { } 
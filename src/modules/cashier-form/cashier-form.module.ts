import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashierForm } from '../../shared/entity/cashier-form.entity';
import { CashierFormController } from './cashier-form.controller';
import { CashierFormService } from './cashier-form.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashierForm])],
  controllers: [CashierFormController],
  providers: [CashierFormService],
  exports: [CashierFormService],
})
export class CashierFormModule {} 
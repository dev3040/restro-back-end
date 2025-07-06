import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashierForm } from '../../shared/entity/cashier-form.entity';
import { CashierFormController } from './cashier-form.controller';
import { CashierFormService } from './cashier-form.service';
import { Branches } from 'src/shared/entity/branches.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashierForm, Branches])],
  controllers: [CashierFormController],
  providers: [CashierFormService],
  exports: [CashierFormService],
})
export class CashierFormModule { } 
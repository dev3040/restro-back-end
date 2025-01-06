import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TransactionFormsService } from "./transaction-forms.service";
import { TransactionFormsController } from "./transaction-forms.controller";
import { TransactionFormsRepository } from "./transaction-forms.repository";

@Module({
    controllers: [TransactionFormsController],
    providers: [TransactionFormsService, ConfigService, TransactionFormsRepository]
})
export class TransactionFormsModule { }

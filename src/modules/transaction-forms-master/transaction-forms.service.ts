import {
    BadRequestException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TransactionFormsRepository } from "./transaction-forms.repository";
import { AddTransactionFormDto, UpdateTransactionFormDto } from "./dto/add-transaction-forms.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { PG_UNIQUE_VIOLATION } from "src/config/common.config";
import { ListFromTransactionsDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class TransactionFormsService {
    constructor(
        @InjectRepository(TransactionFormsRepository)
        private readonly transactionFormsRepository: TransactionFormsRepository
    ) { }

    async addTransactionForm(addTransactionForm: AddTransactionFormDto, user: User): Promise<AppResponse> {
        try {
            const createTransactionForms = await this.transactionFormsRepository.addTransactionForm(addTransactionForm, user);
            return {
                message: "SUC_TRANSACTION_FORM_CREATED",
                data: createTransactionForms
            };
        } catch (error: any) {
            if (error.code == PG_UNIQUE_VIOLATION) {
                throw new BadRequestException('DUPLICATE_ENTRY_TRANSACTION_FORM');
            }
            throwException(error);
        }
    }

    async getTransactionFormList(query: ListFromTransactionsDto): Promise<AppResponse> {
        try {
            const data = await this.transactionFormsRepository.fetchAllTransactionForms(query);
            return {
                message: "SUC_TRANSACTION_FORM_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }


    async getTransactionForm(code): Promise<AppResponse> {
        try {
            // Check transactionForms exists with given ID
            const { transactionForms } = await this.transactionFormsRepository.fetchAllTransactionForms({}, code)
            if (!transactionForms.length) {
                throw new NotFoundException(`ERR_TRANSACTION_FORM_NOT_FOUND`);
            }
            return {
                message: "SUC_TRANSACTION_FORM_LIST_FETCHED",
                data: transactionForms[0]
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editTransactionForm(updateTransactionForms: UpdateTransactionFormDto, code, user): Promise<AppResponse> {
        try {
            await this.transactionFormsRepository.editTransactionForm(updateTransactionForms, code, user);
            return {
                message: "SUC_TRANSACTION_FORM_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTransactionForms(deleteTransactionForms, userId): Promise<AppResponse> {
        try {
            await this.transactionFormsRepository.deleteTransactionForms(deleteTransactionForms, userId);
            return {
                message: "SUC_TRANSACTION_FORM_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }
}


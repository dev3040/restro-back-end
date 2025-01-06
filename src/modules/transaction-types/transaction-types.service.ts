import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TransactionTypesRepository } from "./transaction-types.repository";
import { AddTransactionTypesDto } from "./dto/add-transaction-type.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { UpdateTransactionTypeDto } from "./dto/update-transaction-type.dto";
import { ListTransactionTypesDto } from "src/shared/dtos/list-data.dto";


@Injectable()
export class TransactionTypesService {
    constructor(
        @InjectRepository(TransactionTypesRepository)
        private readonly transactionTypesRepository: TransactionTypesRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addTransactionTypes(addTransactionTypes: AddTransactionTypesDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.transactionTypesRepository.addTransactionTypes(addTransactionTypes, userId);

            const allTransactionTypes = await this.transactionTypesRepository.fetchAllTransactionTypes();
            await this.cacheService.deleteCache(RedisKey.TRANSACTION);
            await this.cacheService.addCache({ key: RedisKey.TRANSACTION, value: allTransactionTypes });

            return {
                message: "SUC_TRANSACTION_TYPE_CREATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTransactionTypesList(query: ListTransactionTypesDto): Promise<AppResponse> {
        try {
            const data = await this.transactionTypesRepository.fetchAllTransactionTypes(query);

            await this.cacheService.addCache({ key: RedisKey.TRANSACTION, value: data.transactionTypes });

            return {
                message: "SUC_TRANSACTION_TYPE_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch transaction types details from ID
     * @author Devang
     * @param id  => TransactionTypes id
     */
    async getTransactionType(id): Promise<AppResponse> {
        try {
            const data = await this.transactionTypesRepository.fetchTransactionTypeDetail(id);
            if (!data) {
                throw new NotFoundException(`ERR_TRANSACTION_TYPE_NOT_FOUND`);
            }
            return {
                message: "SUC_TRANSACTION_TYPE_DETAILS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editTransactionType(updateTransactionTypes: UpdateTransactionTypeDto, id: number, userId: number): Promise<AppResponse> {
        try {
            await this.transactionTypesRepository.editTransactionTypes(updateTransactionTypes, id, userId);

            const data = await this.transactionTypesRepository.fetchAllTransactionTypes();

            await this.cacheService.deleteCache(RedisKey.TRANSACTION);
            await this.cacheService.addCache({ key: RedisKey.TRANSACTION, value: data });

            return {
                message: "SUC_TRANSACTION_TYPE_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactiveTransaction(id, user): Promise<AppResponse> {
        try {
            // Check transaction exists with given ID
            const getTransactionType = await this.transactionTypesRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getTransactionType) {
                throw new NotFoundException(`ERR_TRANSACTION_TYPE_NOT_FOUND`);
            }

            getTransactionType.isActive = !getTransactionType.isActive;
            getTransactionType.updatedBy = user.id;
            await getTransactionType.save();

            return {
                message: getTransactionType.isActive
                    ? "SUC_TRANSACTION_TYPE_ACTIVATED_UPDATED"
                    : "SUC_TRANSACTION_TYPE_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTransactionTypes(transactionType, userId): Promise<AppResponse> {
        return this.transactionTypesRepository.deleteTransactionTypes(transactionType, userId);
    }


}

import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AddOnPricesRepository } from "./branch-master.repository";
import { BranchesDTO, UpdateBranchesDTO } from "./dto/branch-master.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { ListAddOnPricesDto } from "src/shared/dtos/list-data.dto";
@Injectable()
export class AddOnPricesService {
    constructor(
        @InjectRepository(AddOnPricesRepository)
        private readonly addOnPricesRepository: AddOnPricesRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addAddOnPrices(addAddOnPrices: BranchesDTO, user: User): Promise<AppResponse> {
        try {
            const createAdd_on_prices = await this.addOnPricesRepository.addAddOnPrices(addAddOnPrices, user);
            const data = await this.addOnPricesRepository.fetchAllAddOnPrices();
            await this.cacheService.deleteCache(RedisKey.ADD_ON_PRICE);
            await this.cacheService.addCache({ key: RedisKey.ADD_ON_PRICE, value: data });
            return {
                message: "SUC_ADD_ON_PRICE_CREATED",
                data: createAdd_on_prices
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAddOnPricesList(query: ListAddOnPricesDto): Promise<AppResponse> {
        try {
            const { addOnPrices, page } = await this.addOnPricesRepository.fetchAllAddOnPrices(query);

            await this.cacheService.addCache({ key: RedisKey.PRIORITY_TYPE, value: addOnPrices });
            return {
                message: "SUC_ADD_ON_PRICE_FETCHED",
                data: { addOnPrices, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAddOnPrices(id): Promise<AppResponse> {
        try {
            // Check add_on_prices exists with given ID
            const getPrice = await this.addOnPricesRepository.findOne({
                where: { id: id }
            });
            if (!getPrice) {
                throw new NotFoundException(`ERR_ADD_ON_PRICE_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_ADD_ON_PRICE_DETAILS_FETCHED",
                data: getPrice
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editAddOnPrices(updateDto: UpdateBranchesDTO, id): Promise<AppResponse> {
        try {
            await this.addOnPricesRepository.editAddOnPrices(updateDto, id);

            const data = await this.addOnPricesRepository.fetchAllAddOnPrices();
            await this.cacheService.deleteCache(RedisKey.ADD_ON_PRICE);
            await this.cacheService.addCache({ key: RedisKey.ADD_ON_PRICE, value: data });

            return {
                message: "SUC_ADD_ON_PRICE_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactiveAddOnPrice(id, user): Promise<AppResponse> {
        try {
            // Check Add on price exists with given ID
            const getAddOnPrice = await this.addOnPricesRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getAddOnPrice) {
                throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND`);
            }

            getAddOnPrice.isActive = !getAddOnPrice.isActive;
            await getAddOnPrice.save();

            return {
                message: getAddOnPrice.isActive
                    ? "SUC_ADD_ON_PRICE_ACTIVATED_UPDATED"
                    : "SUC_ADD_ON_PRICE_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteAddOnTransactions(deleteAddOnTransactions, userId): Promise<AppResponse> {
        try {
            const response = await this.addOnPricesRepository.deleteAddOnTransactions(deleteAddOnTransactions, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

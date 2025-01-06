import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DealerMasterRepository } from "./dealer-master.repository";
import { AddDealerMasterDto, UpdateDealerMasterDto } from "./dto/dealer-master.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { ListSellersDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class DealerMasterService {
    constructor(
        @InjectRepository(DealerMasterRepository)
        private readonly dealerMasterRepository: DealerMasterRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addDealerMaster(addDealerMaster: AddDealerMasterDto, user: User): Promise<AppResponse> {
        try {
            const createDealerMaster = await this.dealerMasterRepository.addDealerMaster(addDealerMaster, user);
            const data = await this.dealerMasterRepository.fetchAllDealerMaster();
            await this.cacheService.deleteCache(RedisKey.SELLER_MASTER);
            await this.cacheService.addCache({ key: RedisKey.SELLER_MASTER, value: data });
            return {
                message: "SUC_DEALER_CREATED",
                data: createDealerMaster
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getDealerMasterList(query: ListSellersDto): Promise<AppResponse> {
        try {
            const { dealerMasters, page } = await this.dealerMasterRepository.fetchAllDealerMaster(query);
            await this.cacheService.addCache({ key: RedisKey.SELLER_MASTER, value: dealerMasters });
            return {
                message: "SUC_DEALER_LIST_FETCHED",
                data: { dealerMasters, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getDealerMaster(id): Promise<AppResponse> {
        try {
            const getDealerMaster = await this.dealerMasterRepository.findOne({
                where: { id: id }
            });
            if (!getDealerMaster) {
                throw new NotFoundException(`ERR_DEALER_DETAILS_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_DEALER_DETAILS_FETCHED",
                data: getDealerMaster
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editDealerMaster(updateDealerMaster: UpdateDealerMasterDto, id, user: User): Promise<AppResponse> {
        try {
            const data = await this.dealerMasterRepository.fetchAllDealerMaster();
            await this.cacheService.deleteCache(RedisKey.SELLER_MASTER);
            await this.cacheService.addCache({ key: RedisKey.SELLER_MASTER, value: data });

            await this.dealerMasterRepository.editDealerMaster(updateDealerMaster, id, user);
            return {
                message: "SUC_DEALER_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactiveDealer(id, user): Promise<AppResponse> {
        try {
            const getDealer = await this.dealerMasterRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getDealer) {
                throw new NotFoundException(`ERR_DEALER_DETAILS_NOT_FOUND&&&id`);
            }

            getDealer.isActive = !getDealer.isActive;
            getDealer.updatedBy = user.id;
            await getDealer.save();

            return {
                message: getDealer.isActive
                    ? "SUC_DEALER_ACTIVATED_UPDATED"
                    : "SUC_DEALER_DEACTIVATED_UPDATED",
                data: getDealer
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDealerMasters(deleteDealerMaster, userId): Promise<AppResponse> {
        try {
            const response = await this.dealerMasterRepository.deleteDealerMaster(deleteDealerMaster, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }


}

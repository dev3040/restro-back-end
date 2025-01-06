import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PriorityTypesRepository } from "./priority-types.repository";
import { AddPriorityTypesDto, UpdatePriorityTypesDto } from "./dto/add-priority-types.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { ListPrioritiesDto } from "../../shared/dtos/list-data.dto";

@Injectable()
export class PriorityTypesService {
    constructor(
        @InjectRepository(PriorityTypesRepository)
        private readonly priorityTypesRepository: PriorityTypesRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addPriorityTypes(addPriorityTypes: AddPriorityTypesDto, user: User): Promise<AppResponse> {
        try {
            const createPriorityTypes = await this.priorityTypesRepository.addPriorityTypes(addPriorityTypes, user);
            const data = await this.priorityTypesRepository.fetchAllPriorityTypes();
            await this.cacheService.deleteCache(RedisKey.PRIORITY_TYPE);
            await this.cacheService.addCache({ key: RedisKey.PRIORITY_TYPE, value: data });
            return {
                message: "SUC_PRIORITY_CREATED",
                data: createPriorityTypes
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getPriorityTypesList(query: ListPrioritiesDto): Promise<AppResponse> {
        try {
            const { priority_types, page } = await this.priorityTypesRepository.fetchAllPriorityTypes(query);
            await this.cacheService.addCache({ key: RedisKey.PRIORITY_TYPE, value: priority_types });
            return {
                message: "SUC_PRIORITY_LIST_FETCHED",
                data: { priority_types, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getPriorityTypes(id): Promise<AppResponse> {
        try {
            // Check priority_types exists with given ID
            const getpriorityTypes = await this.priorityTypesRepository.findOne({
                where: { id: id }
            });
            if (!getpriorityTypes) {
                throw new NotFoundException(`ERR_PRIORITY_NOT_FOUND`);
            }
            return {
                message: "SUC_PRIORITY_DETAILS_FETCHED",
                data: getpriorityTypes
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editPriorityTypes(updatePriorityTypes: UpdatePriorityTypesDto, id): Promise<AppResponse> {
        try {
            await this.priorityTypesRepository.editPriorityTypes(updatePriorityTypes, id);
            const data = await this.priorityTypesRepository.fetchAllPriorityTypes();
            await this.cacheService.deleteCache(RedisKey.PRIORITY_TYPE);
            await this.cacheService.addCache({ key: RedisKey.PRIORITY_TYPE, value: data });
            return {
                message: "SUC_PRIORITY_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deletePriorityTypes(deletePriority, userId): Promise<AppResponse> {
        try {
            const response = await this.priorityTypesRepository.deletePriorityTypes(deletePriority, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

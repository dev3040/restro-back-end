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
import { ListPrioritiesDto } from "../../shared/dtos/list-data.dto";

@Injectable()
export class PriorityTypesService {
    constructor(
        @InjectRepository(PriorityTypesRepository)
        private readonly priorityTypesRepository: PriorityTypesRepository,
    ) { }

    async addPriorityTypes(addPriorityTypes: AddPriorityTypesDto, user: User): Promise<AppResponse> {
        try {
            const createPriorityTypes = await this.priorityTypesRepository.addPriorityTypes(addPriorityTypes, user);
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
            const { sub_items, page } = await this.priorityTypesRepository.fetchAllPriorityTypes(query);
            return {
                message: "SUC_PRIORITY_LIST_FETCHED",
                data: { sub_items, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getPriorityTypes(id): Promise<AppResponse> {
        try {
            // Check sub_items exists with given ID
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

    async getItemsByCategory(categoryId: number): Promise<AppResponse> {
        try {
            const items = await this.priorityTypesRepository.find({
                where: { categoryId: categoryId }
            });

            if (!items || items.length === 0) {
                throw new NotFoundException(`ERR_ITEMS_NOT_FOUND_FOR_CATEGORY`);
            }

            return {
                message: "SUC_ITEMS_FETCHED",
                data: items
            };
        } catch (error) {
            throwException(error);
        }
    }
}

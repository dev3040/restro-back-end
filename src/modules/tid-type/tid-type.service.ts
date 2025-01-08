import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { TidTypeRepository } from "./tid-type.repository";
import { AddTidTypeDto, UpdateTidTypeDto } from "./dto/add-tid-type.dto";
import { ListTidTypesDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class TidTypeService {
    constructor(
        @InjectRepository(TidTypeRepository)
        private readonly tidTypeRepository: TidTypeRepository,
    ) { }

    async addTidType(addTidType: AddTidTypeDto, user): Promise<AppResponse> {
        try {
            const createTidType = await this.tidTypeRepository.addTidType(addTidType, user);

            return {
                message: "SUC_TID_TYPE_CREATED",
                data: createTidType
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTidTypeList(query: ListTidTypesDto): Promise<AppResponse> {
        try {
            const data = await this.tidTypeRepository.fetchAllTidTypes(query);
            return {
                message: "SUC_TID_TYPE_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editTidType(updateTidType: UpdateTidTypeDto, id, user): Promise<AppResponse> {
        try {
            await this.tidTypeRepository.editTidType(updateTidType, id, user);

            return {
                message: "SUC_TID_TYPE_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTidTypes(tidTypes, userId): Promise<AppResponse> {
        try {
            const response = await this.tidTypeRepository.deleteTidTypes(tidTypes, userId);
            return response;

        } catch (error) {
            throwException(error);
        }
    }

}

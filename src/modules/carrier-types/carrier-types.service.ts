import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { CarrierTypesRepository } from "./carrier-types.repository";
import { AddCarrierTypeDto, UpdateCarrierTypeDto } from "./dto/add-carrier-type.dto";
import { User } from "src/shared/entity/user.entity";
import { ListCarrierTypesDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class CarrierTypesService {
    constructor(
        @InjectRepository(CarrierTypesRepository)
        private readonly carrierTypesRepository: CarrierTypesRepository,
    ) { }

    async addCarrierType(addCarrierTypes: AddCarrierTypeDto, user: User): Promise<AppResponse> {
        try {
            const createCarrierTypes = await this.carrierTypesRepository.addCarrierType(addCarrierTypes, user);
            return {
                message: "SUC_CARRIER_CREATED",
                data: createCarrierTypes
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCarrierTypeList(query: ListCarrierTypesDto): Promise<AppResponse> {
        try {
            const { carrierTypes, page } = await this.carrierTypesRepository.fetchAllCarrierTypes(query);
            return {
                message: "SUC_CARRIER_LIST_FETCHED",
                data: { carrierTypes, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch carrier types details from ID
     * @author Ishita
     * @param id  => CarrierTypes id
     */
    async getCarrierType(id): Promise<AppResponse> {
        try {
            // Check carrierTypes exists with given ID
            const getcarrierTypes = await this.carrierTypesRepository.findOne({
                where: { id: id }
            });
            if (!getcarrierTypes) {
                throw new NotFoundException(`ERR_CARRIER_NOT_FOUND`);
            }
            return {
                message: "SUC_CARRIER_DETAILS_FETCHED",
                data: getcarrierTypes
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editCarrierType(updateCarrierTypes: UpdateCarrierTypeDto, id): Promise<AppResponse> {
        try {
            await this.carrierTypesRepository.editCarrierType(updateCarrierTypes, id);
            return {
                message: "SUC_CARRIER_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteCarrierTypes(deleteCarrier, userId): Promise<AppResponse> {
        try {
            const response = await this.carrierTypesRepository.deleteCarrierTypes(deleteCarrier, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }

}

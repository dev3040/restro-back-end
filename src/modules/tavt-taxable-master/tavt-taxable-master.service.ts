import { Injectable, NotFoundException } from "@nestjs/common";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { TavtTaxAbleMasterRepository } from "./tavt-taxable-master.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { SaveTaxAbleMasterDto } from "./dto/add-taxable-master.dto";
import { TavtTaxableMaster } from "src/shared/entity/tavt-taxable-master.entity";


@Injectable()
export class TavtTaxAbleMasterService {

    constructor(
        @InjectRepository(TavtTaxAbleMasterRepository)
        private readonly tavtTaxAbleMasterRepository: TavtTaxAbleMasterRepository,
    ) { }

    async saveTaxAbleMaster(saveLinks: SaveTaxAbleMasterDto, id, user): Promise<AppResponse> {
        try {
            const result = await this.tavtTaxAbleMasterRepository.saveTaxAbleMaster(saveLinks, id, user);
            return {
                message: result.message,
                data: result.data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactiveTaxAbleMaster(id, user): Promise<AppResponse> {
        try {
            // Check Tavt taxable master exists with given ID
            const getTaxAbleMaster = await TavtTaxableMaster.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });

            if (!getTaxAbleMaster) {
                throw new NotFoundException(`ERR_TAX_ABLE_MASTER_FOUND`);
            }

            getTaxAbleMaster.isActive = !getTaxAbleMaster.isActive;
            await getTaxAbleMaster.save();
            return {
                message: getTaxAbleMaster.isActive
                    ? "SUC_TAX_ABLE_MASTER_ACTIVATED"
                    : "SUC_TAX_ABLE_MASTER_DEACTIVATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTaxAbleMaster(id): Promise<AppResponse> {
        try {
            const getTaxAbleMaster = await this.tavtTaxAbleMasterRepository.getTaxAbleMaster(id);
            if (!getTaxAbleMaster) {
                throw new NotFoundException(`ERR_TAX_ABLE_MASTER_FOUND&&&id`);
            }

            return {
                message: "SUC_TAX_ABLE_MASTER_FETCHED",
                data: getTaxAbleMaster
            };
        } catch (error) {
            throwException(error);
        }
    }
    async getTaxAbleMasterList(query): Promise<AppResponse> {
        try {
            const taxAbleMasterList = await this.tavtTaxAbleMasterRepository.fetchTaxAbleMaster(query);
            return {
                message: "SUC_TAX_ABLE_MASTER_LIST_FETCHED",
                data: taxAbleMasterList
            };
        } catch (error) {
            throwException(error);
        }
    }
    async deleteTaxAbleMasters(taxAble, userId): Promise<AppResponse> {
        try {
            const response = await this.tavtTaxAbleMasterRepository.deleteTaxAbleMasters(taxAble, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

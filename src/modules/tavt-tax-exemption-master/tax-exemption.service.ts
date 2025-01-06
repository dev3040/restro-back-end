import { Injectable, NotFoundException } from "@nestjs/common";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { InjectRepository } from "@nestjs/typeorm";
import { TavtTaxExemptionMasterRepository } from "./tax-exemption.repository";
import { checkTaxExemptionMasterExists } from "src/shared/utility/common-function.methods";


@Injectable()
export class TavtTaxExemptionMasterService {

    constructor(
        @InjectRepository(TavtTaxExemptionMasterRepository)
        private readonly tavtTaxExemptionMasterRepository: TavtTaxExemptionMasterRepository,
    ) { }

    async saveTaxExemptionMaster(saveExemption, id, user): Promise<AppResponse> {
        try {
            const { message, data } = await this.tavtTaxExemptionMasterRepository.saveTaxExemptionMaster(saveExemption, id, user);
            return {
                message,
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
    async activeInactiveTaxExemptionMaster(id, user): Promise<AppResponse> {
        try {
            // Check Tavt taxable master exists with given ID
            const getTaxExemptionMaster = await checkTaxExemptionMasterExists(id);
            if (!getTaxExemptionMaster) {
                throw new NotFoundException(`ERR_TAX_EXEMPTION_MASTER_NOT_FOUND`);
            }

            getTaxExemptionMaster.isActive = !getTaxExemptionMaster.isActive;
            await getTaxExemptionMaster.save();
            return {
                message: getTaxExemptionMaster.isActive
                    ? "SUC_TAX_EXEMPTION_MASTER_ACTIVATED"
                    : "SUC_TAX_EXEMPTION_MASTER_DEACTIVATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTaxExemptionMaster(id): Promise<AppResponse> {
        try {
            const getTaxExemptionMaster = await this.tavtTaxExemptionMasterRepository.getTaxExemptionMaster(id);
            if (!getTaxExemptionMaster) {
                throw new NotFoundException(`ERR_TAX_EXEMPTION_MASTER_NOT_FOUND&&&id`);
            }

            return {
                message: "SUC_TAX_EXEMPTION_MASTER_FETCHED",
                data: getTaxExemptionMaster
            };
        } catch (error) {
            throwException(error);
        }
    }
    async getTaxExemptionMasterList(query): Promise<AppResponse> {
        try {
            const taxExemptionMasterList = await this.tavtTaxExemptionMasterRepository.fetchTaxExemptionMaster(query);
            return {
                message: "SUC_TAX_ABLE_MASTER_LIST_FETCHED",
                data: taxExemptionMasterList
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTaxExemptions(exemption, userId): Promise<AppResponse> {
        try {
            const response = await this.tavtTaxExemptionMasterRepository.deleteTaxExemptions(exemption, userId);
            return response;
        } catch (error) {
            throwException(error);
        }

    }

}

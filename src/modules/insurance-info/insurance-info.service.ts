import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { InsuranceInfoRepository } from "./insurance-info.repository";
import { CreateInsuranceDto } from "./dto/add-insurance-info.dto";

@Injectable()
export class InsuranceInfoService {
    constructor(
        @InjectRepository(InsuranceInfoRepository)
        private readonly insuranceInfoRepository: InsuranceInfoRepository,
    ) { }

    async saveInsuranceInfo(insuranceInfoDto: CreateInsuranceDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.insuranceInfoRepository.saveInsuranceInfo(insuranceInfoDto, userId);
            return {
                message: "SUC_INSURANCE_INFO_SAVED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getInsuranceInfo(ticketId): Promise<AppResponse> {
        try {
            const getInsuranceInfo = await this.insuranceInfoRepository.getInsuranceInfo(ticketId);
            if (!getInsuranceInfo) {
                throw new NotFoundException(`ERR_INSURANCE_INFO_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_INSURANCE_INFO_FETCHED",
                data: getInsuranceInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

}

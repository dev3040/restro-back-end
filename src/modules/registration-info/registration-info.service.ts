import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { RegistrationInfoRepository } from "./registration-info.repository";
import { RegistrationInfoDto } from "./dto/add-registration-info.dto";

@Injectable()
export class RegistrationInfoService {
    constructor(
        @InjectRepository(RegistrationInfoRepository)
        private readonly registrationInfoRepository: RegistrationInfoRepository,
    ) { }

    async saveRegInfo(regInfo: RegistrationInfoDto, userId: number): Promise<AppResponse> {
        try {
            const titleInfo = await this.registrationInfoRepository.saveRegistrationInfo(regInfo, userId);

            return {
                message: "SUC_REG_INFO_SAVED",
                data: titleInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getRegInfo(ticketId): Promise<AppResponse> {
        try {
            const regInfo = await this.registrationInfoRepository.getRegInfo(ticketId)
            return {
                message: "SUC_REG_INFO_FETCHED",
                data: regInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getCalcInfo(ticketId): Promise<AppResponse> {
        try {
            const regInfo = await this.registrationInfoRepository.getCalcInfo(ticketId)
            return {
                message: "SUC_REG_INFO_FETCHED",
                data: regInfo
            };
        } catch (error) {
            throwException(error);
        }
    }



}

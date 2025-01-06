import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { BasicInfoRepository } from "./basic-info.repository";
import { SetBasicInfoDto } from "./dto/set-basic-info.dto";

@Injectable()
export class BasicInfoService {
    constructor(
        @InjectRepository(BasicInfoRepository)
        private readonly basicInfoRepository: BasicInfoRepository,
    ) { }

    async setBasicInfo(setBasicInfo: SetBasicInfoDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            const data = await this.basicInfoRepository.setBasicInfo(setBasicInfo, userId, isSummary, false);
            return {
                message: "SUC_BASIC_INFO_SAVED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getBasicInfo(ticketId): Promise<AppResponse> {
        try {
            const data = await this.basicInfoRepository.getBasicInfo(ticketId)
            if (!data) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&id`)
            }
            return {
                message: "SUC_BASIC_INFO_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

}

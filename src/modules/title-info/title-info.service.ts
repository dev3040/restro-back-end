import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { TitleInfoRepository } from "./title-info.repository";
import { TitleInfoDto } from "./dto/add-title-info.dto";

@Injectable()
export class TitleInfoService {
    constructor(
        @InjectRepository(TitleInfoRepository)
        private readonly titleInfoRepository: TitleInfoRepository,
    ) { }

    async saveTitleInfo(titleInfoDto: TitleInfoDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            const titleInfo = await this.titleInfoRepository.saveTitleInfo(titleInfoDto, userId, isSummary);

            return {
                message: "SUC_TITLE_INFO_SAVED",
                data: titleInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

}

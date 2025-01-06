import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TradeInInfoRepository } from "./trade-in-info.repository";
import { TradeInIdDto, UpdateTradeInInfoDto } from "./dto/add-trade-in-info.dto";
import { throwException } from "src/shared/utility/throw-exception";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { checkTradeInInfoExists } from "src/shared/utility/common-function.methods";
import { User } from "src/shared/entity/user.entity";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";

@Injectable()
export class TradeInInfoService {
    constructor(
        @InjectRepository(TradeInInfoRepository)
        private readonly tradeInInfoRepository: TradeInInfoRepository,
        private socketGateway: SocketGateway,
    ) { }

    async deleteTradeInInfo(id: string, user): Promise<AppResponse> {
        const getData = await checkTradeInInfoExists(id)
        getData.isDeleted = true;
        getData.updatedBy = user.id;
        await getData.save();
        let latestTradeInfo: any = await this.tradeInInfoRepository.getTradeInInfoByTicket(getData.ticketId);

        // Emit data : Trade in info
        this.socketGateway.formDataUpdatedEvent(getData.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTradeInfo, DataEntryFormType.TRADE_IN_INFO);
        return {
            message: "SUC_TRADE_IN_INFO_DELETED",
            data: {}
        };
    }

    async getTradeInInfoList(query): Promise<AppResponse> {
        try {
            const tradeInInfo = await this.tradeInInfoRepository.fetchTradeInInfo(query);
            return {
                message: "SUC_TRADE_IN_INFO_LIST_FETCHED",
                data: tradeInInfo
            };
        } catch (error) {
            throwException(error);
        }
    }
    async saveTradeInInfo(id: TradeInIdDto, tradeInInfo: UpdateTradeInInfoDto, user: User, isSummary: boolean): Promise<AppResponse> {
        try {
            await this.tradeInInfoRepository.saveTradeInInfo(tradeInInfo, id, user, isSummary);
            return {
                message: "SUC_TRADE_IN_INFO_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }
}

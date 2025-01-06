import { Module } from "@nestjs/common";
import { TradeInInfoController } from "./trade-in-info.controller";
import { TradeInInfoService } from "./trade-in-info.service";
import { ConfigService } from "@nestjs/config";
import { TradeInInfoRepository } from "./trade-in-info.repository";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Module({
    imports: [ActivityLogsModule],
    controllers: [TradeInInfoController],
    providers: [TradeInInfoService, ConfigService, TradeInInfoRepository, TicketsRepository],

})
export class TradeInInfoModule { }

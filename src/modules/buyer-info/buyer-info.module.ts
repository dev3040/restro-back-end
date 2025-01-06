import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BuyerInfoController } from "./buyer-info.controller";
import { BuyerInfoService } from "./buyer-info.service";
import { BuyerInfoRepository } from "./buyer-info.repository";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";


@Module({
    imports: [ActivityLogsModule],
    controllers: [
        BuyerInfoController
    ],
    providers: [ConfigService, BuyerInfoService, BuyerInfoRepository, ActivityLogsRepository, TicketsRepository]
})
export class BuyerInfoModule { }

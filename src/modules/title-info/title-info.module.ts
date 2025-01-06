import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TitleInfoController } from "./title-info.controller";
import { TitleInfoRepository } from "./title-info.repository";
import { TitleInfoService } from "./title-info.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";

@Module({
    controllers: [TitleInfoController],
    providers: [ConfigService, TitleInfoRepository, TitleInfoService, TicketsRepository, ActivityLogsService, ActivityLogsRepository]
})
export class TitleInfoModule { }

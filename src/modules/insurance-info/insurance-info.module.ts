import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InsuranceInfoController } from "./insurance-info.controller";
import { InsuranceInfoService } from "./insurance-info.service";
import { InsuranceInfoRepository } from "./insurance-info.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Module({
    controllers: [InsuranceInfoController],
    providers: [InsuranceInfoService, ConfigService, InsuranceInfoRepository,
        ActivityLogsService, ActivityLogsRepository, TicketsRepository]
})
export class InsuranceInfoModule { }

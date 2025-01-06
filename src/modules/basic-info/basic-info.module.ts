import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BasicInfoController } from "./basic-info.controller";
import { BasicInfoRepository } from "./basic-info.repository";
import { BasicInfoService } from "./basic-info.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { VinInfoRepository } from "../vin-info/vin-info.repository";
import { VinInfoModule } from "../vin-info/vin-info.module";
import { RegistrationInfo } from "src/shared/entity/registration-info.entity";
import { RegistrationInfoRepository } from "../registration-info/registration-info.repository";

@Module({
    imports: [VinInfoModule, RegistrationInfo],
    controllers: [BasicInfoController],
    providers: [ConfigService, BasicInfoRepository, BasicInfoService, TicketsRepository, ActivityLogsService, ActivityLogsRepository, VinInfoRepository, RegistrationInfoRepository]
})
export class BasicInfoModule { }

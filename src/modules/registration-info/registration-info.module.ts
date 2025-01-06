import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RegistrationInfoController } from "./registration-info.controller";
import { RegistrationInfoRepository } from "./registration-info.repository";
import { RegistrationInfoService } from "./registration-info.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { VinInfoRepository } from "../vin-info/vin-info.repository";
import { VinInfoModule } from "../vin-info/vin-info.module";

@Module({
    imports: [forwardRef(() => VinInfoModule)],
    controllers: [RegistrationInfoController],
    providers: [ConfigService, RegistrationInfoRepository, RegistrationInfoService, TicketsRepository, ActivityLogsService, ActivityLogsRepository, VinInfoRepository]
})
export class RegistrationInfoModule { }

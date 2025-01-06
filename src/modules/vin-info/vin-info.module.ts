import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VinInfoController } from "./vin-info.controller";
import { VinInfoRepository } from "./vin-info.repository";
import { VinInfoService } from "./vin-info.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { RegistrationInfoRepository } from "../registration-info/registration-info.repository";
import { RegistrationInfoModule } from "../registration-info/registration-info.module";

@Module({
    imports: [forwardRef(() => RegistrationInfoModule)],
    controllers: [VinInfoController],
    providers: [ConfigService, VinInfoRepository, VinInfoService, TicketsRepository, ActivityLogsService, ActivityLogsRepository, RegistrationInfoRepository]
})
export class VinInfoModule { }

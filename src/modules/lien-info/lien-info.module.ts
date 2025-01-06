import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LienInfoController } from "./lien-info.controller";
import { LienInfoService } from "./lien-info.service";
import { LienInfoRepository } from "./lien-info.repository";
import { LienMasterRepository } from "../lien-master/lien-master.repository";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Module({
    imports: [ActivityLogsModule],
    controllers: [LienInfoController],
    providers: [LienInfoService, ConfigService, LienInfoRepository, LienMasterRepository, TicketsRepository]
})
export class LienInfoModule { }

import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TavtFormService } from "./tavt-form.service";
import { TavtRepository } from "./tavt-form.repository";
import { TavtFormController } from "./tavt-form.controller";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";


@Module({
    controllers: [TavtFormController],
    providers: [ConfigService, TavtFormService, TavtRepository,
        ActivityLogsService, ActivityLogsRepository, TicketsRepository],
    exports: [TavtRepository]
})
export class TavtFormModule { }

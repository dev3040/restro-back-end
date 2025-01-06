import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BillingProcessController } from "./billing-process.controller";
import { BillingProcessRepository } from "./billing-process-repository";
import { BillingProcessService } from "./billing-process.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Module({
   controllers: [BillingProcessController],
   providers: [ConfigService, BillingProcessRepository, BillingProcessService,
      ActivityLogsService, ActivityLogsRepository, TicketsRepository]
})
export class BillingProcessModule { }

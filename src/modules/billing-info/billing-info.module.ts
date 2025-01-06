import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BillingInfoController } from "./billing-info.controller";
import { BillingInfoRepository } from "./billing-info-repository";
import { BillingInfoService } from "./billing-info.service";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Module({
   controllers: [BillingInfoController],
   providers: [ConfigService, BillingInfoRepository, BillingInfoService,
      ActivityLogsService, ActivityLogsRepository, TicketsRepository]
})
export class BillingInfoModule { }

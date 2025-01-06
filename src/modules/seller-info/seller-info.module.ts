import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SellerInfoController } from "./seller-info.controller";
import { SellerInfoService } from "./seller-info.service";
import { SellerInfoRepository } from "./seller-info.repository";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";
import { TicketManagementModule } from "../ticket-management/ticket-management.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";


@Module({
    imports: [
        forwardRef(() => TicketManagementModule),
        ActivityLogsModule
    ],
    controllers: [SellerInfoController],
    providers: [ConfigService, SellerInfoService, SellerInfoRepository, TicketsRepository],
    exports: [SellerInfoRepository]
})
export class SellerInfoModule { }

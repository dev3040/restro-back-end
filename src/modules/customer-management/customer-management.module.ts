import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CustomerManagementService } from "./customer-management.service";
import { CustomerContactController, CustomerManagementController } from "./customer-management.controller";
import { CustomerManagementRepository } from "./customer-management.repository";

@Module({
    controllers: [CustomerManagementController, CustomerContactController],
    providers: [CustomerManagementService, ConfigService, CustomerManagementRepository]
})
export class CustomerManagementModule { }

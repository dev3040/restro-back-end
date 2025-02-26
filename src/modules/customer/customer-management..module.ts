import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CustomerService } from "./customer-management..service";
import { CustomerController } from "./customer-management.controller";
import { CustomerRepository } from "./customer-management..repository";

@Module({
    controllers: [CustomerController],
    providers: [CustomerService, ConfigService, CustomerRepository]
})
export class CustomerModule { }

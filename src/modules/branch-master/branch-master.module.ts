import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AddOnPricesService } from "./branch-master.service";
import { AddOnPricesController } from "./branch-master.controller";
import { AddOnPricesRepository } from "./branch-master.repository";

@Module({
    imports: [],
    controllers: [AddOnPricesController],
    providers: [AddOnPricesService, ConfigService, AddOnPricesRepository]
})
export class AddOnPricesModule { }

import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AddOnPricesService } from "./branch-master.service";
import { AddOnPricesController } from "./branch-master.controller";
import { AddOnPricesRepository } from "./branch-master.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [AddOnPricesController],
    providers: [AddOnPricesService, ConfigService, AddOnPricesRepository]
})
export class AddOnPricesModule { }

import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AddOnPricesService } from "./add-on-prices.service";
import { AddOnPricesController } from "./add-on-prices.controller";
import { AddOnPricesRepository } from "./add-on-prices.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [AddOnPricesController],
    providers: [AddOnPricesService, ConfigService, AddOnPricesRepository]
})
export class AddOnPricesModule { }

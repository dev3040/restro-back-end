import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CarrierTypesService } from "./carrier-types.service";
import { CarrierTypesController } from "./carrier-types.controller";
import { CarrierTypesRepository } from "./carrier-types.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [CarrierTypesController],
    providers: [CarrierTypesService, ConfigService, CarrierTypesRepository]
})
export class CarrierTypesModule { }

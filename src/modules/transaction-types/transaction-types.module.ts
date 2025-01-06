import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TransactionTypesService } from "./transaction-types.service";
import { TransactionTypesController } from "./transaction-types.controller";
import { TransactionTypesRepository } from "./transaction-types.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";
import { CacheModule } from "@nestjs/cache-manager";


@Module({
    imports: [RedisCacheModule],
    controllers: [TransactionTypesController],
    providers: [TransactionTypesService, ConfigService, TransactionTypesRepository, CacheModule]
})
export class TransactionTypesModule { }

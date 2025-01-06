import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PriorityTypesService } from "./priority-types.service";
import { PriorityTypesController } from "./priority-types.controller";
import { PriorityTypesRepository } from "./priority-types.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [PriorityTypesController],
    providers: [PriorityTypesService, ConfigService, PriorityTypesRepository]
})
export class PriorityTypesModule { }

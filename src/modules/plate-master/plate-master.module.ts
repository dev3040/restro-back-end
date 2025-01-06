import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PlateMasterService } from "./plate-master.service";
import { PlateMasterRepository } from "./plate-master.repository";
import { PlateMasterController } from "./plate-master.controller";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";


@Module({
    imports: [RedisCacheModule],
    controllers: [PlateMasterController],
    providers: [PlateMasterService, ConfigService, PlateMasterRepository]
})
export class PlateMasterModule { }

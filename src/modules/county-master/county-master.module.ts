import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CountyMasterService } from "./county-master.service";
import { CountyCheatSheetController, CountyContactController, CountyLinksController, CountyMasterController, CountyMilageRatesController, CountyProcessingController, CountyTransactionWorkController } from "./county-master.controller";
import { CountyMasterRepository } from "./county-master.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [
        CountyMasterController,
        CountyContactController,
        CountyLinksController,
        CountyCheatSheetController,
        CountyMilageRatesController,
        CountyProcessingController,
        CountyTransactionWorkController
    ],
    providers: [CountyMasterService, ConfigService, CountyMasterRepository]
})
export class CountyMasterModule { }

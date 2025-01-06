import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LienMasterService } from "./lien-master.service";
import { LienMasterController } from "./lien-master.controller";
import { LienMasterRepository } from "./lien-master.repository";

@Module({
    controllers: [LienMasterController],
    providers: [LienMasterService, ConfigService, LienMasterRepository]
})
export class LienMasterModule { }

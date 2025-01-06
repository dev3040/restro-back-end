import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModulesService } from "./modules.service";
import { ModulesController } from "./modules.controller";
import { ModulesRepository } from "./modules.repository";

@Module({
    controllers: [ModulesController],
    providers: [ModulesService, ConfigService, ModulesRepository]
})
export class ModulesModule { }

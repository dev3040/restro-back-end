import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PriorityTypesService } from "./priority-types.service";
import { PriorityTypesController } from "./priority-types.controller";
import { PriorityTypesRepository } from "./priority-types.repository";

@Module({
    imports: [],
    controllers: [PriorityTypesController],
    providers: [PriorityTypesService, ConfigService, PriorityTypesRepository]
})
export class PriorityTypesModule { }

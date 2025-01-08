import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TidTypeService } from "./tid-type.service";
import { TidTypeController } from "./tid-type.controller";
import { TidTypeRepository } from "./tid-type.repository";

@Module({
    imports: [],
    controllers: [TidTypeController],
    providers: [TidTypeService, ConfigService, TidTypeRepository]
})
export class TidTypeModule { }

import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DepartmentsService } from "./departments.service";
import { DepartmentsController } from "./departments.controller";
import { DepartmentsRepository } from "./departments.repository";

@Module({
    controllers: [DepartmentsController],
    providers: [DepartmentsService, ConfigService, DepartmentsRepository]
})
export class DepartmentsModule { }

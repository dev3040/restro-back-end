import { Module } from "@nestjs/common";
import { BatchPrepController } from "./batch-prep.controller";
import { BatchPrepService } from "./batch-prep.service";
import { BatchPrepRepository } from "./batch-prep.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Batches } from "src/shared/entity/batch.entity";
import { BatchPrepMapping } from "src/shared/entity/batch-prep-mapping.entity";
import { BatchGroups } from "src/shared/entity/batch-group.entity";
import { FedExService } from "../master-listing/fedex.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Batches, BatchPrepMapping, BatchGroups]),
    ],
    controllers: [BatchPrepController],
    providers: [BatchPrepService, BatchPrepRepository,FedExService]
})
export class BatchPrepModule { }

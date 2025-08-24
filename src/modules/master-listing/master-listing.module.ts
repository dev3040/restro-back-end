import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingService } from "./master-listing.service";
import { ConfigController,  ListingController } from "./master-listing.controller";
import { SubItems } from "src/shared/entity/sub-items.entity";
import { SubItemBranchMapping } from "src/shared/entity/sub-item-branch-mapping.entity";
import { Branches } from "src/shared/entity/branches.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([SubItems, SubItemBranchMapping, Branches])
    ],
    controllers: [ListingController, ConfigController],
    providers: [ListingService, ConfigService],
    exports: []
})
export class MasterListingModule { }

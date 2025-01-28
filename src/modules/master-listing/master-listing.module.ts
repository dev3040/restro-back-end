import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ListingService } from "./master-listing.service";
import { ConfigController,  ListingController } from "./master-listing.controller";

@Module({
    controllers: [ListingController, ConfigController],
    providers: [ListingService, ConfigService],
    exports: []
})
export class MasterListingModule { }

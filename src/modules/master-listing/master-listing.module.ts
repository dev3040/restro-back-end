import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ListingService } from "./master-listing.service";
import { ConfigController, FedExConfigController, ListingController } from "./master-listing.controller";
import { FedExService } from "./fedex.service";

@Module({
    controllers: [ListingController, ConfigController, FedExConfigController],
    providers: [ListingService, ConfigService,FedExService],
    exports: [FedExService]
})
export class MasterListingModule { }

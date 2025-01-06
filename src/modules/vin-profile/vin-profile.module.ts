import { Module } from "@nestjs/common"
import { VinProfileService } from "./vin-profile.service";
import { VinProfileRepository } from "./vin-profile.repository";
import { VinProfileController } from "./vin-profile.controller";
import { FormsPdfModule } from "../forms-pdf/forms-pdf.module";

@Module({
    imports: [FormsPdfModule],
    controllers: [VinProfileController],
    providers: [VinProfileService, VinProfileRepository]
})
export class VinProfileModule { }
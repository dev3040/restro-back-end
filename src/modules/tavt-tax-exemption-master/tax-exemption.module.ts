import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TavtTaxExemptionMasterService } from "./tax-exemption.service";
import { TavtTaxExemptionMasterController } from "./tax-exemption.controller";
import { TavtTaxExemptionMasterRepository } from "./tax-exemption.repository";


@Module({
    controllers: [TavtTaxExemptionMasterController],
    providers: [ConfigService, TavtTaxExemptionMasterRepository, TavtTaxExemptionMasterService]
})
export class TavtTaxExemptionMasterModule { }

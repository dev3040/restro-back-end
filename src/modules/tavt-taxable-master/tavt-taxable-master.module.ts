import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TavtTaxAbleMasterRepository } from "./tavt-taxable-master.repository";
import { TavtTaxAbleMasterService } from "./tavt-taxable-master.service";
import { TavtTaxAbleMasterController } from "./tavt-taxable-master.controller";


@Module({
    controllers: [TavtTaxAbleMasterController],
    providers: [ConfigService, TavtTaxAbleMasterRepository, TavtTaxAbleMasterService]
})
export class TavtTaxAbleMasterModule { }

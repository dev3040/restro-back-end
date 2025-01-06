import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FormsPdfController } from "./forms-pdf.controller";
import { FormsPdfService } from "./forms-pdf.service";
import { FormsPdfRepository } from "./forms-pdf.repository";
import { TavtFormModule } from "../tavt-form/tavt-form.module";


@Module({
    imports:[TavtFormModule],
    controllers: [FormsPdfController],
    providers: [ConfigService, FormsPdfService, FormsPdfRepository],
    exports:[FormsPdfModule]
})
export class FormsPdfModule { }

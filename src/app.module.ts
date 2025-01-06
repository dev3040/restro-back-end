import { Module, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "./config/typeorm.config";
import { MailerModule } from "@nestjs-modules/mailer";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "config/validation";
import { configuration } from "config/configuration";
import { SendMailerUtility } from "./shared/utility/send-mailer.utility";
import { mailConfig } from "./config/mail.config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { DepartmentsModule } from "./modules/department/departments.module";
import { CarrierTypesModule } from "./modules/carrier-types/carrier-types.module";
import { PriorityTypesModule } from "./modules/priority-types/priority-types.module";
import { TicketStatusModule } from "./modules/ticket-status/ticket-status.module";
import { TransactionTypesModule } from "./modules/transaction-types/transaction-types.module";
import { ModulesModule } from "./modules/modules/modules.module";
import { CustomerManagementModule } from "./modules/customer-management/customer-management.module";
import { TicketManagementModule } from "./modules/ticket-management/ticket-management.module";
import { AddOnPricesModule } from "./modules/add-on-prices/add-on-prices.module";
import { TidTypeModule } from "./modules/tid-type/tid-type.module";
import { BasicInfoModule } from "./modules/basic-info/basic-info.module";
import { VinInfoModule } from "./modules/vin-info/vin-info.module";
import { TradeInInfoModule } from "./modules/trade-in-info/trade-in-info.module";
import { TitleInfoModule } from "./modules/title-info/title-info.module";
import { MasterListingModule } from "./modules/master-listing/master-listing.module";
import { DealerMasterModule } from "./modules/dealer-master/dealer-master.module";
import { ActivityLogsModule } from "./modules/activity-logs/activity-logs.module";
import { LienMasterModule } from "./modules/lien-master/lien-master.module";
import { SellerInfoModule } from "./modules/seller-info/seller-info.module";
import { BuyerInfoModule } from "./modules/buyer-info/buyer-info.module";
import { LienInfoModule } from "./modules/lien-info/lien-info.module";
import { InsuranceInfoModule } from "./modules/insurance-info/insurance-info.module";
import { SocketModule } from "./modules/socket/socket.module";
import { PlateMasterModule } from "./modules/plate-master/plate-master.module";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";
import { RegistrationInfoModule } from "./modules/registration-info/registration-info.module";
import { CountyMasterModule } from "./modules/county-master/county-master.module";
import { TavtFormModule } from "./modules/tavt-form/tavt-form.module";
import { TavtTaxAbleMasterModule } from "./modules/tavt-taxable-master/tavt-taxable-master.module";
import { TavtTaxExemptionMasterModule } from "./modules/tavt-tax-exemption-master/tax-exemption.module";
import { BillingInfoModule } from "./modules/billing-info/billing-info.module";
import { FormsPdfModule } from "./modules/forms-pdf/forms-pdf.module";
import { ParseIsSummaryPipe } from "./shared/pipes/is-summary.pipe";
import { FilterBookmarkModule } from './modules/filter-bookmark/filter-bookmark.module';
import { TransactionFormsModule } from "./modules/transaction-forms-master/transaction-forms.module";
import { BatchPrepModule } from "./modules/batch-prep/batch-prep.module";
import { BillingProcessModule } from "./modules/billing-process/billing-process.module";
import { VinProfileModule } from "./modules/vin-profile/vin-profile.module";


@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `${process.cwd()}/config/env/${process.env.NODE_ENV}.env`,
            load: [configuration],
            validationSchema,
            isGlobal: true
        }),
        TypeOrmModule.forRootAsync(typeOrmConfig),
        MailerModule.forRootAsync(mailConfig),
        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 120
        }),
        SocketModule,
        ActivityLogsModule,
        AuthModule,
        UserModule,
        RedisCacheModule,
        DepartmentsModule,
        CarrierTypesModule,
        PriorityTypesModule,
        DealerMasterModule,
        LienMasterModule,
        CountyMasterModule,
        TicketStatusModule,
        TransactionTypesModule,
        ModulesModule,
        CustomerManagementModule,
        TicketManagementModule,
        AddOnPricesModule,
        PlateMasterModule,
        TavtTaxExemptionMasterModule,
        TavtTaxAbleMasterModule,
        TidTypeModule,
        MasterListingModule,
        DealerMasterModule,
        BasicInfoModule,
        VinInfoModule,
        TradeInInfoModule,
        TitleInfoModule,
        InsuranceInfoModule,
        LienInfoModule,
        SellerInfoModule,
        BuyerInfoModule,
        RegistrationInfoModule,
        TavtFormModule,
        BillingInfoModule,
        FormsPdfModule,
        FilterBookmarkModule,
        TransactionFormsModule,
        BatchPrepModule,
        BillingProcessModule,
        VinProfileModule
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_PIPE,
            useClass: ValidationPipe,
        },
        {
            provide: ParseIsSummaryPipe,
            useClass: ParseIsSummaryPipe,
        },
        SendMailerUtility,
    ],
})
export class AppModule { }

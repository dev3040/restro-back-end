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
import { AddOnPricesModule } from "./modules/branch-master/branch-master.module";
// import { MasterListingModule } from "./modules/master-listing/master-listing.module";
import { ParseIsSummaryPipe } from "./shared/pipes/is-summary.pipe";
import { CarrierTypesModule } from "./modules/outlet-menu/carrier-types.module";
import { PriorityTypesModule } from "./modules/sub-menu/priority-types.module";
import { TidTypeModule } from "./modules/tid-type/tid-type.module";


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
        AuthModule,
        UserModule,
        // DepartmentsModule,
        AddOnPricesModule,
        CarrierTypesModule,
        PriorityTypesModule,
        TidTypeModule
        // MasterListingModule,
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

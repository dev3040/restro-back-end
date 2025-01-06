import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { TicketManagementService } from './ticket-management.service';
import { TicketManagementController } from './ticket-management.controller';
import { TicketsRepository } from './ticket-management.repository';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityLogsRepository } from '../activity-logs/activity-logs.repository';
import { VinInfoRepository } from '../vin-info/vin-info.repository';
import { BasicInfoRepository } from '../basic-info/basic-info.repository';
import { VinInfoModule } from '../vin-info/vin-info.module';
import { RegistrationInfoModule } from '../registration-info/registration-info.module';
import { RegistrationInfoRepository } from '../registration-info/registration-info.repository';
import { BillingInfoRepository } from '../billing-info/billing-info-repository';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
    imports: [
        VinInfoModule,
        RegistrationInfoModule,
        forwardRef(() => ActivityLogsModule)
    ],
    controllers: [TicketManagementController],
    providers: [
        TicketManagementService,
        ConfigService,
        TicketsRepository,
        ActivityLogsService,
        ActivityLogsRepository,
        VinInfoRepository,
        BasicInfoRepository,
        RegistrationInfoRepository,
        BillingInfoRepository
    ],
    exports: [TicketManagementService],
})
export class TicketManagementModule { }

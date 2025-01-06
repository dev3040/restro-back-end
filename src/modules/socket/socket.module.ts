import { Global, Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { TicketManagementModule } from '../ticket-management/ticket-management.module';

@Global()
@Module({
    imports: [forwardRef(() => ActivityLogsModule), forwardRef(() => TicketManagementModule)],
    providers: [SocketGateway],
    exports: [SocketGateway]
})
export class SocketModule { }

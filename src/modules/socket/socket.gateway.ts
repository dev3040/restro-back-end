import { SubscribeMessage, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { SocketChannelEnum } from 'src/shared/enums/socket-channel.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { TicketManagementService } from '../ticket-management/ticket-management.service';

@WebSocketGateway({
    namespace: '/socket',
    cors: { origin: '*', methods: ["GET", "POST"] },
    transports: ['websocket', 'polling']
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer() server: Server;

    constructor(
        @Inject(forwardRef(() => ActivityLogsService))
        private readonly activityLogsService: ActivityLogsService,
        @Inject(forwardRef(() => TicketManagementService))
        private readonly ticketService: TicketManagementService
    ) { }


    private logger: Logger = new Logger('SocketGateway');

    afterInit(server: Server) {
        this.logger.log("Socket Initialized!!!")
    }

    async handleConnection(client) {
        try {
            this.logger.log(`Client connected: ${client.id}`)
        } catch (error) {
            throw new Error();
        }
    }

    async handleDisconnect(client) {
        try {
            this.logger.log(`Client disconnected: ${client.id}`);
        } catch (error) {
            throw new Error();
        }
    }

    /*============== Form details page ============== */
    @SubscribeMessage(SocketChannelEnum.JOIN_ROOM)
    handleJoinRoom(client: Socket, room: string) {
        try {
            client.join(room);
            client.emit(SocketEventEnum.ROOM_JOINED, room);

            this.ticketService.getMissingTicketDataCount(parseInt(room))
        } catch (error) {
            throw new Error();
        }
    }

    /*============== Form details page ============== */
    @SubscribeMessage(SocketChannelEnum.LEAVE_ROOM)
    handleLeaveRoom(client: Socket, room: string) {
        try {
            this.logger.log(`Client left: ${client.id}`);
            client.leave(room);
        } catch (error) {
            throw new Error();
        }
    }

    /*============== Add activity comment ===============*/
    @SubscribeMessage(SocketChannelEnum.ADD_COMMENT)
    async handleAddComment(client: Socket, data) {
        try {
            if (!data.comment || !data.ticketId || !data.user.id) {
                throw new Error()
            }
            await this.activityLogsService.addComment(data);
        } catch (error) {
            throw new Error();
        }
    }

    /*=========== for emitting data =========== */
    notify(clientId, event: SocketEventEnum, data: any) {
        this.server.to(clientId).emit(event, data);
    }


    /*====== for emitting data for form modification ======*/
    formDataUpdatedEvent(clientId, event: string, data: any, formType: DataEntryFormType) {
        let res: any = data;
        res.formType = formType;

        this.server.to(clientId).emit(event, data, formType);
        delete res.formType;
    }

    /*============== List page============== */
    @SubscribeMessage(SocketChannelEnum.JOIN_LIST_ROOM)
    handleListJoinRoom(client: Socket, room: string) {
        try {
            client.join(room);
            this.logger.log(`List joined: ${client.id}`);
            client.emit(SocketEventEnum.LIST_ROOM_JOINED, room);
        } catch (error) {
            throw new Error();
        }
    }

    @SubscribeMessage(SocketChannelEnum.LEAVE_LIST_ROOM)
    handleListLeaveRoom(client: Socket, room: string) {
        try {
            client.leave(room);
            this.logger.log(`List left: ${client.id}`);
            client.emit(SocketEventEnum.LIST_ROOM_LEFT, room);
        } catch (error) {
            throw new Error();
        }
    }
    /* ==========================================*/

}







import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TicketStatusService } from "./ticket-status.service";
import { TicketStatusController } from "./ticket-status.controller";
import { TicketStatusRepository } from "./ticket-status.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";

@Module({
    imports: [RedisCacheModule],
    controllers: [TicketStatusController],
    providers: [TicketStatusService, ConfigService, TicketStatusRepository]
})
export class TicketStatusModule { }

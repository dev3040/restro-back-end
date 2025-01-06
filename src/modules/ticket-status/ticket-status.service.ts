import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { TicketStatusRepository } from "./ticket-status.repository";
import { AddTicketStatusDto, UpdateTicketStatusDto } from "./dto/add-ticket-status.dto";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { ListStatusesDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class TicketStatusService {
    constructor(
        @InjectRepository(TicketStatusRepository)
        private readonly ticketStatusRepository: TicketStatusRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addTicketStatus(addTicketStatus: AddTicketStatusDto, user): Promise<AppResponse> {
        try {
            const createTicketStatus = await this.ticketStatusRepository.addTicketStatus(addTicketStatus, user);
            const data = await this.ticketStatusRepository.fetchAllTicketStatus();
            await this.cacheService.deleteCache(RedisKey.TICKET_STATUS);
            await this.cacheService.addCache({ key: RedisKey.TICKET_STATUS, value: data });
            return {
                message: "SUC_TICKET_STATUS_CREATED",
                data: createTicketStatus
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketStatusList(query: ListStatusesDto): Promise<AppResponse> {
        try {
            const { ticketStatus, page } = await this.ticketStatusRepository.fetchAllTicketStatus(query);

            await this.cacheService.addCache({ key: RedisKey.TICKET_STATUS, value: ticketStatus });

            return {
                message: "SUC_TICKET_STATUS_LIST_FETCHED",
                data: { ticketStatus, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch ticketStatus details from ID
     * @author Ishita
     * @param id  => TicketStatus id
     */
    async getTicketStatus(id): Promise<AppResponse> {
        try {
            // Check ticketStatus exists with given ID
            const status = await this.ticketStatusRepository.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!status) {
                throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND`);
            }
            return {
                message: "SUC_TICKET_STATUS_DETAILS_FETCHED",
                data: status
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editTicketStatus(updateTicketStatus: UpdateTicketStatusDto, id, user): Promise<AppResponse> {
        try {
            await this.ticketStatusRepository.editTicketStatus(updateTicketStatus, id, user);
            const data = await this.ticketStatusRepository.fetchAllTicketStatus();
            await this.cacheService.deleteCache(RedisKey.TICKET_STATUS);
            await this.cacheService.addCache({ key: RedisKey.TICKET_STATUS, value: data });
            return {
                message: "SUC_TICKET_STATUS_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTicketStatus(id, user): Promise<AppResponse> {
        try {
            // Check ticket Status exists with given ID
            const getData = await this.ticketStatusRepository.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!getData) {
                throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND`);
            }

            getData.isDeleted = true;
            getData.updatedBy = user.id;
            await getData.save();
            await this.cacheService.deleteCache(RedisKey.TICKET_STATUS);
            return {
                message: "SUC_TICKET_STATUS_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }
    async activeInactiveTicketStatus(id, user): Promise<AppResponse> {
        try {
            // Check Ticket status exists with given ID
            const getTicketStatus = await this.ticketStatusRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getTicketStatus) {
                throw new NotFoundException(`ERR_ADD_ON_PRICE_NOT_FOUND`);
            }

            getTicketStatus.isActive = !getTicketStatus.isActive;
            getTicketStatus.updatedBy = user.id;
            await getTicketStatus.save();

            return {
                message: getTicketStatus.isActive
                    ? "SUC_TICKET_STATUS_ACTIVATED_UPDATED"
                    : "SUC_TICKET_STATUS_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }
    async removeTicketStatuses(ticketStatuses, userId): Promise<AppResponse> {
        try {
            const response = await this.ticketStatusRepository.removeTicketStatuses(ticketStatuses, userId);
            return response;

        } catch (error) {
            throwException(error);
        }
    }

}

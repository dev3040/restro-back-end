import { DataSource, Repository } from 'typeorm';
import { ConflictException, Injectable } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { AddTicketStatusDto, UpdateTicketStatusDto } from './dto/add-ticket-status.dto';
import { TicketStatuses } from 'src/shared/entity/ticket-statuses.entity';
import { User } from 'src/shared/entity/user.entity';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { checkTicketStatusExists, commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class TicketStatusRepository extends Repository<TicketStatuses> {
    constructor(readonly dataSource: DataSource) {
        super(TicketStatuses, dataSource.createEntityManager());
    }

    async addTicketStatus(addTicketStatus: AddTicketStatusDto, user: User): Promise<TicketStatuses> {
        try {
            const ticketNameExists = await this.manager.createQueryBuilder(TicketStatuses, "ticketStatus")
                .select(["ticketStatus.id", "ticketStatus.internalStatusName"])
                .where(`(LOWER(ticketStatus.internalStatusName) = :name)`, {
                    name: `${addTicketStatus.internalStatusName.toLowerCase()}`
                })
                .andWhere(`(ticketStatus.isDeleted = false)`)
                .getOne();
            if (ticketNameExists) {
                throw new ConflictException("ERR_TICKET_STATUS_EXIST&&&internalStatusName");
            }

            const ticketStatus = new TicketStatuses();
            ticketStatus.internalStatusName = addTicketStatus.internalStatusName;
            ticketStatus.externalStatusName = addTicketStatus.externalStatusName;
            ticketStatus.isActive = addTicketStatus.isActive;
            ticketStatus.createdBy = user.id

            return await ticketStatus.save();

        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllTicketStatus(filterDto?: any): Promise<{ ticketStatus: TicketStatuses[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(TicketStatuses, "ticketStatus")
                .select(["ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.externalStatusName", "ticketStatus.isActive", "ticketStatus.createdAt", "ticketStatus.slug"])
                .where("(ticketStatus.isDeleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }
                listQuery.orderBy(`ticketStatus.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST');

                if (filterDto.search) {
                    listQuery.andWhere(
                        "(ticketStatus.internalStatusName ILIKE :search OR ticketStatus.externalStatusName ILIKE :search)",
                        { search: `%${filterDto.search}%` }
                    );
                }
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(ticketStatus.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(ticketStatus.isActive = false)")
            }

            const ticketStatusWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = ticketStatusWithCount[1];
            }

            return { ticketStatus: ticketStatusWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editTicketStatus(updateTicketStatus: UpdateTicketStatusDto, id, user: User): Promise<TicketStatuses> {
        try {
            const ticketStatusExist = await checkTicketStatusExists(id, null)

            const ticketNameExists = await this.manager.createQueryBuilder(TicketStatuses, "ticketStatus")
                .select(["ticketStatus.id", "ticketStatus.internalStatusName"])
                .where(`(LOWER(ticketStatus.internalStatusName) = :name)`, {
                    name: `${updateTicketStatus.internalStatusName.toLowerCase()}`
                })
                .andWhere(`(ticketStatus.isDeleted = false)`)
                .andWhere(`(ticketStatus.id != :id)`, { id })
                .getOne();
            if (ticketNameExists) {
                throw new ConflictException("ERR_TICKET_STATUS_EXIST&&&internalStatusName");
            }

            ticketStatusExist.internalStatusName = updateTicketStatus.internalStatusName;
            ticketStatusExist.externalStatusName = updateTicketStatus.externalStatusName;
            ticketStatusExist.isActive = updateTicketStatus.isActive;
            ticketStatusExist.updatedBy = user.id;
            await ticketStatusExist.save();
            return ticketStatusExist;
        } catch (error) {
            throwException(error);
        }
    }
    async removeTicketStatuses(transactionType, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TicketStatuses,
                transactionType,
                userId,
                success.SUC_TICKET_STATUS_DELETED,
                error.ERR_TICKET_STATUS_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

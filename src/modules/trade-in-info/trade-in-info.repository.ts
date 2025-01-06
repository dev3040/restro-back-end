import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { TradeInInfo } from 'src/shared/entity/trade-in-info.entity';
import { TradeInIdDto } from './dto/add-trade-in-info.dto';
import { checkTicketExists, getOdometerCodeName } from 'src/shared/utility/common-function.methods';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';


@Injectable()
export class TradeInInfoRepository extends Repository<TradeInInfo> {
    constructor(readonly dataSource: DataSource,
        private socketGateway: SocketGateway,
        private ticketsRepository: TicketsRepository,
        private activityLogService: ActivityLogsService) {
        super(TradeInInfo, dataSource.createEntityManager());
    }

    async fetchTradeInInfo(query): Promise<TradeInInfo[]> {
        try {
            return this.manager.createQueryBuilder(TradeInInfo, "tradeInInfo")
                .where("tradeInInfo.ticketId = :ticketId", { ticketId: query.ticketId })
                .andWhere("tradeInInfo.isDeleted = false")
                .select(["tradeInInfo.id", "tradeInInfo.odometerCode", "tradeInInfo.lastOdometerReading", "tradeInInfo.tradeInAllowance", "tradeInInfo.vinNumber"])
                .orderBy('tradeInInfo.id', 'ASC')
                .getMany();
        } catch (error) {
            throwException(error);
        }
    }

    async saveTradeInInfo(tradeInInfo, id: TradeInIdDto, user: User, isSummary: boolean) {
        try {
            let isUpdate: boolean;
            let tradeIn: any;
            let isNewTrade: boolean;
            const ticketId = tradeInInfo.ticketId;

            if (id?.id) {
                tradeIn = await this.getTradeInInfo(id.id);
                const criteria = { id: id.id };

                // Update existing record 
                await this.update(criteria, { ...tradeInInfo, ticketId: ticketId, updatedBy: user.id });
                isUpdate = true;

            } else if (id?.ticketId) {
                await checkTicketExists(id.ticketId); //new entry
                const existingEntriesCount = await TradeInInfo.count({
                    where: {
                        ticketId: tradeInInfo.ticketId,
                        isDeleted: false
                    }
                });

                if (existingEntriesCount >= 4) {
                    throw new Error("ERR_TRADE_IN_INFO_MAX");
                }
                const getTradeInData = await TradeInInfo.findOne({
                    select: ["id", "ticketId"],
                    where: {
                        ticketId: id.ticketId,
                        isDeleted: false
                    }
                })
                // Create a new record
                tradeIn = this.create({ ...tradeInInfo, createdBy: user.id });
                await this.save(tradeIn);

                isNewTrade = true;
                isUpdate = !getTradeInData ? false : true;
            }

            let latestTradeInfo: any = await this.getTradeInInfoByTicket(ticketId);

            // Emit data : Trade in info
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTradeInfo, DataEntryFormType.TRADE_IN_INFO);

            // ACTIVITY LOG 
            if (isUpdate) {
                if (isNewTrade) {
                    const data: ActivityLogPayload = {
                        userId: user.id,
                        actionType: ActivityLogActionType.FORM_NEW_RECORD,
                        ticketId: ticketId,
                        fieldName: null,
                        newData: null,
                        oldData: null,
                        formType: !isSummary ? DataEntryFormType.TRADE_IN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_TRADE_IN_ACTIVITY
                    }
                    this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                } else {
                    let changes: any[] = [];
                    const unwantedKeys = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'id', 'isActive', 'isDeleted'];
                    unwantedKeys.forEach(property => { delete latestTradeInfo[property] });

                    const keyMappings = {
                        odometerCode: "Odometer code",
                        vinNumber: "VIN",
                        lastOdometerReading: "Last odometer reading",
                        tradeInAllowance: "Trade in allowance"
                    };

                    for (let key in latestTradeInfo.tradeInInfo[0]) {
                        if (tradeIn.tradeInInfo[0][key] != latestTradeInfo.tradeInInfo[0][key]) {
                            const fieldName = keyMappings[key];
                            if (fieldName) {
                                let oldValue = tradeIn.tradeInInfo[0][key];
                                let newValue = latestTradeInfo.tradeInInfo[0][key];

                                if (key === "odometerCode") {
                                    oldValue = getOdometerCodeName(oldValue);
                                    newValue = getOdometerCodeName(newValue);
                                }
                                changes.push({
                                    fieldName: fieldName,
                                    oldValue: oldValue,
                                    newValue: newValue
                                });
                            }
                        }
                    }
                    if (changes.length > 0) {
                        const data: ActivityLogPayload[] = changes.map(change => ({
                            userId: user.id,
                            actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                            ticketId: tradeInInfo.ticketId,
                            fieldName: change.fieldName,
                            newData: change.newValue,
                            oldData: change.oldValue,
                            formType: !isSummary ? DataEntryFormType.TRADE_IN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_TRADE_IN_ACTIVITY
                        }));
                        this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                    }
                }
            } else {
                const data: ActivityLogPayload = {
                    userId: user.id,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.TRADE_IN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_TRADE_IN_ACTIVITY
                }
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_START);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, user.id);
        } catch (error) {
            throwException(error);
        }
    }

    async getTradeInInfo(id): Promise<{ tradeInInfo: TradeInInfo[] }> {
        try {
            const tradeInInfo = await this.manager.createQueryBuilder(TradeInInfo, "tradeInInfo")
                .where("tradeInInfo.id = :id", { id: id })
                .andWhere("tradeInInfo.isDeleted = false")
                .select(["tradeInInfo.id", "tradeInInfo.odometerCode", "tradeInInfo.lastOdometerReading",
                    "tradeInInfo.tradeInAllowance", "tradeInInfo.vinNumber", "tradeInInfo.ticketId"])
                .getMany();
            if (!tradeInInfo.length) {
                throw new NotFoundException(`ERR_TRADE_IN_INFO_NOT_FOUND`);
            }
            return { tradeInInfo };
        } catch (error) {
            throwException(error);
        }
    }

    async getTradeInInfoByTicket(ticketId): Promise<{ tradeInInfo: TradeInInfo[] }> {
        try {
            const tradeInInfo = await this.manager.createQueryBuilder(TradeInInfo, "tradeInInfo")
                .where("tradeInInfo.ticketId = :id", { id: ticketId })
                .andWhere("tradeInInfo.isDeleted = false")
                .select(["tradeInInfo.id", "tradeInInfo.odometerCode", "tradeInInfo.lastOdometerReading",
                    "tradeInInfo.tradeInAllowance", "tradeInInfo.vinNumber", "tradeInInfo.ticketId"])
                .orderBy('tradeInInfo.id', 'ASC')
                .getMany();
            return { tradeInInfo };
        } catch (error) {
            throwException(error);
        }
    }
}

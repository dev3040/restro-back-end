import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TitleInfo } from 'src/shared/entity/title-info.entity';
import { TitleInfoDto } from './dto/add-title-info.dto';
import { throwException } from 'src/shared/utility/throw-exception';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { checkStateExists, checkTicketExists, getOdometerCodeName } from 'src/shared/utility/common-function.methods';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';


@Injectable()
export class TitleInfoRepository extends Repository<TitleInfo> {
    constructor(
        readonly dataSource: DataSource,
        private activityLogService: ActivityLogsService,
        private ticketsRepository: TicketsRepository,
        private socketGateway: SocketGateway
    ) {
        super(TitleInfo, dataSource.createEntityManager());
    }

    async saveTitleInfo(titleInfoDto: TitleInfoDto, userId: number, isSummary: boolean): Promise<TitleInfo> {
        try {
            let isUpdate: boolean;
            const ticketId = titleInfoDto.ticketId;
            await checkTicketExists(ticketId);

            if (titleInfoDto?.stateId)
                await checkStateExists(titleInfoDto?.stateId)

            let titleInfo: any = await this.getTitleInfo(ticketId)

            let tInfo: any = titleInfoDto;
            tInfo.brands = titleInfoDto?.brands ? JSON.stringify(titleInfoDto?.brands) : null;

            if (titleInfo) {
                // Update the existing record 
                await this.update(titleInfo.id, { ...tInfo, updatedBy: userId });
                isUpdate = true;
            } else {
                // Create a new record
                titleInfo = this.create({ ...tInfo, createdBy: userId });
                await this.save(titleInfo);
                isUpdate = false;
            }

            const latestTitleInfo: any = await this.getTitleInfo(ticketId);

            // Emit data ====>> title info 
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTitleInfo, DataEntryFormType.TITLE_INFO);

            // ACTIVITY LOG 
            let data;
            if (isUpdate) {
                let newTitleInfo: any = { ...latestTitleInfo };
                const unwantedKeys = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isActive', "ticketId", "titleState", "brands"];
                unwantedKeys.forEach(key => delete newTitleInfo[key]);

                const changes: any[] = [];
                for (let key in newTitleInfo) {
                    if (titleInfo[key] !== newTitleInfo[key]) {
                        let change = {
                            fieldName: "",
                            oldValue: titleInfo[key],
                            newValue: latestTitleInfo[key]
                        };
                        switch (key) {
                            case "stateId":
                                change.fieldName = "state";
                                change.oldValue = titleInfo?.titleState?.name || null;
                                change.newValue = latestTitleInfo?.titleState?.name || null;
                                break;
                            case "currentTitle":
                                change.fieldName = "current title";
                                break;
                            case "isNew":
                                change.fieldName = "vehicle use";
                                change.oldValue = titleInfo[key] ? "new" : "used";
                                change.newValue = latestTitleInfo[key] ? "new" : "used";
                                break;
                            case "odometerCode":
                                change.fieldName = "odometer code";
                                change.oldValue = await getOdometerCodeName(titleInfo[key]);
                                change.newValue = await getOdometerCodeName(latestTitleInfo[key]);
                                break;
                            case "odometerReading":
                                change.fieldName = "odometer reading";
                                break;
                            case "odometerUnit":
                                change.fieldName = "odometer unit";
                                break;
                            case "odometerDate":
                                change.fieldName = "odometer date";
                                break;
                            /* case "brands":
                                const oldValue = titleInfo[key] ? JSON.stringify(titleInfo[key]) : null;
                                const newValue = latestTitleInfo[key] ? JSON.stringify(latestTitleInfo[key]) : null;
                
                                if (oldValue !== newValue) {
                                    change.fieldName = key;
                                    change.oldValue = null;
                                    change.newValue = null;
                                }
                                break; */
                            default:
                                continue;
                        }
                        changes.push(change);
                    }
                }
                if (changes.length > 0) {
                    data = changes.map(change => ({
                        userId: userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: !isSummary ? DataEntryFormType.TITLE_INFO_ACTIVITY : DataEntryFormType.SUMMARY_TITLE_INFO_ACTIVITY
                    }));
                }
            } else {
                data = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.TITLE_INFO_ACTIVITY : DataEntryFormType.SUMMARY_TITLE_INFO_ACTIVITY
                }
            }
            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);

            return latestTitleInfo;
        } catch (error) {
            throwException(error);
        }
    }

    async getTitleInfo(ticketId: number) {
        try {
            const data = await this.manager.createQueryBuilder(TitleInfo, "titleInfo")
                .leftJoinAndSelect("titleInfo.titleState", "titleState")
                .select([
                    "titleInfo.id", "titleInfo.ticketId", "titleInfo.stateId", "titleInfo.currentTitle", "titleInfo.isNew", "titleInfo.brands", "titleInfo.odometerCode", "titleInfo.odometerReading", "titleInfo.odometerUnit", "titleInfo.odometerDate",
                    "titleState.id", "titleState.name", "titleState.code"
                ])
                .where(`(titleInfo.ticketId = :ticketId)`, { ticketId })
                .getOne();
            return data;
        } catch (error) {
            throwException(error);
        }
    }
}



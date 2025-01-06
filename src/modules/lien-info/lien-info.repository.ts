import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { checkTicketExists, getIdOption } from 'src/shared/utility/common-function.methods';
import { LienInfo } from 'src/shared/entity/lien-info.entity';
import { LienInfoDto } from './dto/add-lien-info.dto';
import { LienMaster } from 'src/shared/entity/lien-master.entity';
import { LienMasterRepository } from '../lien-master/lien-master.repository';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';

@Injectable()
export class LienInfoRepository extends Repository<LienInfo> {
    constructor(readonly dataSource: DataSource,
        readonly lienMasterRepository: LienMasterRepository,
        private ticketsRepository: TicketsRepository,
        private socketGateway: SocketGateway,
        private activityLogService: ActivityLogsService
    ) {
        super(LienInfo, dataSource.createEntityManager());
    }

    async saveLienInfo(lienInfoDto: LienInfoDto, user: User): Promise<LienInfo> {
        try {
            if (lienInfoDto.isLienChecked) {
                await this.update({ ticketId: lienInfoDto.ticketId }, { isDeleted: true });
                const data = this.create({ isLienChecked: true, ticketId: lienInfoDto.ticketId });
                return data.save();
            }
            await checkTicketExists(lienInfoDto.ticketId);
            if (lienInfoDto.lienId && !lienInfoDto.isElt && !lienInfoDto.isIndividual) {
                const lienHolder = await LienMaster.findOne({ where: { id: lienInfoDto.lienId } });
                if (!lienHolder) throw new NotFoundException("ERR_LIEN_MASTER_NOT_FOUND&&&lienId")
                if (lienInfoDto.address) {
                    const payload = {
                        holderName: lienHolder.holderName,
                        address: lienInfoDto.address,
                    }
                    await this.lienMasterRepository.editLienMaster(payload, lienHolder.id, user);
                }
            }
            if (lienInfoDto.id) {
                const lienInfo = await this.findOne({ where: { ticketId: lienInfoDto.ticketId, id: lienInfoDto.id } })
                if (!lienInfo) throw new NotFoundException("ERR_LIEN_INFO_NOT_FOUND&&&id")
                lienInfo.ticketId = lienInfoDto.ticketId;
                lienInfo.firstName = lienInfoDto.firstName;
                lienInfo.lastName = lienInfoDto.lastName;
                lienInfo.middleName = lienInfoDto.middleName;
                lienInfo.idOption = lienInfoDto.idOption;
                lienInfo.lienId = lienInfoDto.lienId;
                lienInfo.isElt = lienInfoDto.isElt;
                lienInfo.isIndividual = lienInfoDto.isIndividual;
                lienInfo.suffix = lienInfoDto.suffix;
                lienInfo.address = lienInfoDto.address;
                lienInfo.updatedBy = user.id;
                lienInfo.licenseNumber = lienInfoDto.licenseNumber;

                await lienInfo.save();
                return lienInfo;
            }
            const lienInfoCount = await this.count({ where: { ticketId: lienInfoDto.ticketId, isDeleted: false, isLienChecked: false } });
            if (lienInfoCount > 1) {
                throw Error("ERR_LIEN_INFO_EXCEED_LIMIT")
            }
            const lienInfoCreate = new LienInfo();
            lienInfoCreate.ticketId = lienInfoDto.ticketId;
            lienInfoCreate.firstName = lienInfoDto.firstName;
            lienInfoCreate.lastName = lienInfoDto.lastName;
            lienInfoCreate.middleName = lienInfoDto.middleName;
            lienInfoCreate.idOption = lienInfoDto.idOption;
            lienInfoCreate.lienId = lienInfoDto.lienId;
            lienInfoCreate.isElt = lienInfoDto.isElt;
            lienInfoCreate.isIndividual = lienInfoDto.isIndividual;
            lienInfoCreate.suffix = lienInfoDto.suffix;
            lienInfoCreate.address = lienInfoDto.address;
            lienInfoCreate.licenseNumber = lienInfoDto.licenseNumber;
            lienInfoCreate.createdBy = user.id;
            return lienInfoCreate.save();
        } catch (error) {
            throwException(error);
        }
    }

    async getLienInfo(id) {
        try {
            const getLienInfo = await this.manager.createQueryBuilder(LienInfo, "lienInfo")
                .select([
                    "lienInfo.id", "lienInfo.ticketId", "lienInfo.lienId", "lienInfo.idOption", "lienInfo.licenseNumber",
                    "lienInfo.firstName", "lienInfo.middleName", "lienInfo.lastName", "lienInfo.suffix", "lienInfo.isElt",
                    "lienInfo.isIndividual", "lienInfo.address", "lienInfo.isLienChecked",
                    "lienInfo.holderName"
                ])
                .where('(lienInfo.id = :id AND lienInfo.isDeleted=false)', { id: id })
                .orderBy('lienInfo.id', 'ASC')
                .getMany();

            if (!getLienInfo || getLienInfo.length === 0) {
                throw new NotFoundException(`ERR_LIEN_INFO_NOT_FOUND&&&id`);
            }
            return getLienInfo[0];

        } catch (error) {
            throwException(error);
        }
    }

    async getLienInfoTicket(ticketId) {
        try {
            const lienInfo = await this.manager.createQueryBuilder(LienInfo, "lienInfo")
                .leftJoinAndSelect('lienInfo.lien', 'lien')
                .select([
                    "lienInfo.id", "lienInfo.ticketId", "lienInfo.lienId", "lienInfo.idOption", "lienInfo.licenseNumber",
                    "lienInfo.firstName", "lienInfo.middleName", "lienInfo.lastName", "lienInfo.suffix", "lienInfo.isElt",
                    "lienInfo.lienHolderId",
                    "lienInfo.isIndividual", "lienInfo.address", "lienInfo.isLienChecked",
                    "lien.id", "lien.address", "lien.holderName", "lien.lienHolderId", "lien.isActive", "lien.isDeleted",
                    "lienInfo.holderName"
                ])
                .where('(lienInfo.ticketId = :id AND lienInfo.isDeleted=false)', { id: ticketId })
                .orderBy('lienInfo.id', 'ASC')
                .getMany();

            return { lienInfo };

        } catch (error) {
            throwException(error);
        }
    }

    async saveLienData(lienInfo, id, userId: number, isSummary: boolean) {
        try {
            let isUpdate: boolean;
            let lienData: any;
            let isNewLien: boolean;
            let ticketId: number;

            if (id?.id) {
                lienData = await this.getLienInfo(id.id);
                const criteria = { id: id.id };
                ticketId = id.ticketId;

                // Update existing record 
                await this.update(criteria, { ...lienInfo, ticketId: lienInfo.ticketId, updatedBy: userId });
                isUpdate = true;

            } else if (id?.ticketId) {
                await checkTicketExists(id.ticketId); //new entry

                const existingEntriesCount = await LienInfo.count({
                    where: { ticketId: id.ticketId, isDeleted: false }
                });

                if (existingEntriesCount >= 2) {
                    throw new Error("ERR_LIEN_INFO_EXCEED_LIMIT");
                }

                const getLienInfo = await LienInfo.findOne({
                    select: ["id", "ticketId"],
                    where: { ticketId: id.ticketId }
                })
                // Create a new record
                lienData = this.create({ ...lienInfo, createdBy: userId });
                await this.save(lienData);
                isNewLien = true;
                isUpdate = !getLienInfo ? false : true;
                ticketId = id.ticketId;
            }

            let latestLienData: any = await this.getLienInfoTicket(lienInfo.ticketId);
            // Emit data for updated form data 
            this.socketGateway.formDataUpdatedEvent(parseInt(id.ticketId || lienInfo.ticketId),
                SocketEventEnum.FORM_DETAILS_UPDATE, latestLienData, DataEntryFormType.LIEN_INFO);

            // ACTIVITY LOG  
            if (isUpdate) {
                if (isNewLien) {
                    const data: ActivityLogPayload = {
                        userId: userId,
                        actionType: ActivityLogActionType.FORM_NEW_RECORD,
                        ticketId: ticketId,
                        fieldName: null,
                        newData: null,
                        oldData: null,
                        formType: !isSummary ? DataEntryFormType.LIEN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_LIEN_INFO_ACTIVITY
                    }
                    this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                } else {
                    let changes: any[] = [];
                    const unwantedKeys = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'id', 'isActive', 'isDeleted', 'ticketId'];
                    unwantedKeys.forEach(property => { delete latestLienData[property] });

                    const fieldMap = {
                        lienId: {
                            fieldName: "Lien ID",
                            transform: (data) => data?.lienId?.holderName
                        },
                        idOption: {
                            fieldName: "ID option",
                            transform: getIdOption
                        },
                        licenseNumber: { fieldName: "License number" },
                        firstName: { fieldName: "First name" },
                        lastName: { fieldName: "Last name" },
                        middleName: { fieldName: "Middle name" },
                        suffix: { fieldName: "Suffix" },
                        isElt: { fieldName: "ELT" },
                        isIndividual: { fieldName: "Individual" },
                        isLienChecked: { fieldName: "Lien" },
                        address: { fieldName: "Address" }
                    };
                    for (let key in latestLienData) {
                        if (lienData[key] !== latestLienData[key]) {
                            const field = fieldMap[key];
                            if (field) {
                                const oldValue = field.transform ? field.transform(lienData[key]) : lienData[key];
                                const newValue = field.transform ? field.transform(latestLienData[key]) : latestLienData[key];

                                changes.push({
                                    fieldName: field.fieldName,
                                    actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                                    oldValue: oldValue,
                                    newValue: newValue,
                                });
                            }
                        }
                    }
                    if (changes.length > 0) {
                        const data: ActivityLogPayload[] = changes.map(change => ({
                            userId: userId,
                            actionType: change.actionType,
                            ticketId: lienInfo.ticketId,
                            fieldName: change.fieldName,
                            newData: change.newValue,
                            oldData: change.oldValue,
                            formType: !isSummary ? DataEntryFormType.LIEN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_LIEN_INFO_ACTIVITY
                        }));
                        this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                    }
                }
            } else {
                const data: ActivityLogPayload = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.LIEN_INFO_ACTIVITY : DataEntryFormType.SUMMARY_LIEN_INFO_ACTIVITY
                }
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_START);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(lienInfo.ticketId, userId);
        }
        catch (error) {
            throwException(error);
        }
    }
}

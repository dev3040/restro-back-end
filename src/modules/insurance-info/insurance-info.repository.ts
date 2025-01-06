import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { checkTicketExists, getInsuranceTypeName } from 'src/shared/utility/common-function.methods';
import { InsuranceInfo } from 'src/shared/entity/insurance-info.entity';
import { CreateInsuranceDto } from './dto/add-insurance-info.dto';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { InsuranceType } from 'src/shared/enums/insurance-info.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';

@Injectable()
export class InsuranceInfoRepository extends Repository<InsuranceInfo> {
    constructor(readonly dataSource: DataSource,
        private socketGateway: SocketGateway,
        private ticketsRepository: TicketsRepository,
        private activityLogService: ActivityLogsService) {
        super(InsuranceInfo, dataSource.createEntityManager());
    }

    async saveInsuranceInfo(insuranceInfoDto: CreateInsuranceDto, userId: number): Promise<InsuranceInfo> {
        try {
            let isUpdate: boolean;
            const ticketId = insuranceInfoDto.ticketId;

            await checkTicketExists(ticketId);

            let insuranceInformation: any = await this.getInsuranceInfo(ticketId);

            if (insuranceInformation) {
                if (insuranceInformation?.type == InsuranceType.FLEET && insuranceInfoDto?.type !== InsuranceType.FLEET) {
                    insuranceInfoDto.companyName ||= null;
                    insuranceInfoDto.policyNumber ||= null;
                    insuranceInfoDto.effectiveDate ||= null;
                    insuranceInfoDto.expirationDate ||= null;
                } else if (insuranceInformation?.type == InsuranceType.BINDER && insuranceInfoDto?.type !== InsuranceType.BINDER) {
                    insuranceInfoDto.effectiveDate ||= null;
                    insuranceInfoDto.expirationDate ||= null;
                }

                // Update the existing record 
                await this.update(insuranceInformation.id, { ...insuranceInfoDto, updatedBy: userId });
                isUpdate = true
            } else {
                // Create a new record
                insuranceInformation = this.create({ ...insuranceInfoDto, createdBy: userId });
                await this.save(insuranceInformation);
                isUpdate = false;
            }

            const latestInsuranceData = await this.getInsuranceInfo(ticketId);

            //Emit data ===>>> Insurance form 
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestInsuranceData, DataEntryFormType.INSURANCE_INFO);

            // ACTIVITY LOG 
            let data;
            if (isUpdate) {
                const changes: any[] = [];
                const unwantedKeys = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'ticketId'];
                unwantedKeys.forEach(key => delete latestInsuranceData[key]);

                for (let key in latestInsuranceData) {
                    if (insuranceInformation[key] !== latestInsuranceData[key]) {
                        let change = {
                            fieldName: "",
                            oldValue: insuranceInformation[key],
                            newValue: latestInsuranceData[key]
                        };
                        switch (key) {
                            case "type":
                                change.fieldName = `insurance ${key}`;
                                change.oldValue = await getInsuranceTypeName(insuranceInformation[key]);
                                change.newValue = await getInsuranceTypeName(latestInsuranceData[key]);
                                break;
                            case "expirationDate":
                                change.fieldName = "expiration date";
                                break;
                            case "companyName":
                                change.fieldName = "company name";
                                break;
                            case "effectiveDate":
                                change.fieldName = "effective date";
                                break;
                            case "policyNumber":
                                change.fieldName = "policy number";
                                break;
                            default:
                                continue;
                        }
                        changes.push(change);
                    }
                }
                if (changes.length > 0) {
                    data = changes.map(change => ({
                        userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: DataEntryFormType.INSURANCE_INFO_ACTIVITY
                    }));
                }
            } else {
                data = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: DataEntryFormType.INSURANCE_INFO_ACTIVITY
                }
            }
            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);
            return latestInsuranceData;
        } catch (error) {
            throwException(error);
        }
    }

    async getInsuranceInfo(ticketId): Promise<InsuranceInfo> {
        try {
            const getInsuranceInfo = await this.findOne({
                where: { ticketId: ticketId },
                select: ["id", "type", "companyName", "effectiveDate", "expirationDate", "policyNumber"]
            });
            return getInsuranceInfo;
        } catch (error) {
            throwException(error);
        }
    }
}

import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { BasicInfo } from 'src/shared/entity/basic-info.entity';
import { checkContactExists, checkCustomerExists, checkTicketExists, checkTransactionTypeExists } from 'src/shared/utility/common-function.methods';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';
import { TicketStatuses } from 'src/shared/entity/ticket-statuses.entity';
import { SetBasicInfoDto } from './dto/set-basic-info.dto';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { VinInfoRepository } from '../vin-info/vin-info.repository';

@Injectable()
export class BasicInfoRepository extends Repository<BasicInfo> {
    constructor(
        readonly dataSource: DataSource,
        private readonly ticketsRepository: TicketsRepository,
        private readonly vinInfoRepository: VinInfoRepository,
        private activityLogService: ActivityLogsService,
        private socketGateway: SocketGateway
    ) {
        super(BasicInfo, dataSource.createEntityManager());
    }

    async setBasicInfo(setBasicInfo: SetBasicInfoDto, userId: number, isSummary: boolean, skipEditTaskCustomer?: boolean): Promise<BasicInfo> {
        try {
            const { vinInfo, ticketId } = setBasicInfo;
            let isUpdate: boolean;
            let customerUpdated: boolean = false;
            let hideDefaultErrorVal = null;

            const ticketDetail = await checkTicketExists(ticketId);

            // Perform all validations and fetch necessary data
            const validationPromises = [
                setBasicInfo?.customerId && await checkCustomerExists(setBasicInfo.customerId),
                setBasicInfo?.transactionTypeId && await checkTransactionTypeExists(setBasicInfo.transactionTypeId),
                setBasicInfo?.customerContactInfoId && await checkContactExists(setBasicInfo.customerContactInfoId)
            ];
            await Promise.all(validationPromises);

            /* check if vin already exists, if not then create a entry in master table */
            let latestVinData = null;
            let vinId = ticketDetail.vinId;

            if (vinInfo) {
                //check is hideDefaultError provided
                const hideErrVal = Boolean(setBasicInfo.hideDefaultError) === true
                    ? setBasicInfo.hideDefaultError === true
                    : false

                const vinDetails = await this.ticketsRepository.checkVinData(vinInfo.vinNumber)

                if (!vinDetails) {
                    const { vinError } = setBasicInfo;
                    const newVin = await this.ticketsRepository.createVinInfo(vinInfo, null, vinError, hideErrVal);
                    vinId = newVin.id;
                } else {
                    const newVin = await this.ticketsRepository.createVinInfo(vinDetails, vinDetails.id, null, hideErrVal);
                    vinId = newVin.id;
                }

                ticketDetail.vinId = vinId
                delete setBasicInfo?.vinInfo;
            }
            delete setBasicInfo?.vinError;
            hideDefaultErrorVal = setBasicInfo?.hideDefaultError;
            delete setBasicInfo?.hideDefaultError;

            latestVinData = await this.vinInfoRepository.getVinData(vinId, ticketId);

            let checkBasicInfoDetails: any = await this.getBasicInfo(ticketId);
            if (checkBasicInfoDetails) {
                if (setBasicInfo?.customerId && skipEditTaskCustomer === false) {
                    ticketDetail.customerId = setBasicInfo.customerId;
                    customerUpdated = true;
                }
                delete checkBasicInfoDetails?.vinInfo;
                // Update the existing record 
                await this.update(checkBasicInfoDetails.id, { ...setBasicInfo, updatedBy: userId });
                isUpdate = true;
            } else {
                // Create a new record
                checkBasicInfoDetails = this.create({ ...setBasicInfo, createdBy: userId });
                await this.save(checkBasicInfoDetails);

                //save ticket details
                if (!ticketDetail.startDate) {
                    ticketDetail.startDate = new Date();
                }
                if (setBasicInfo?.customerId) {
                    ticketDetail.customerId = setBasicInfo.customerId;
                }
                const ticketStatus = await TicketStatuses.findOne({
                    select: ['id', 'slug'],
                    where: { slug: "in_process" }
                });
                if (ticketStatus) {
                    ticketDetail.ticketStatusId = ticketStatus?.id;
                }
                isUpdate = false;
            }
            //save ticket details
            await ticketDetail.save();

            const latestBasicInfo = await this.getBasicInfo(ticketId);

            // Emit data ===> Basic info 
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBasicInfo, DataEntryFormType.BASIC_INFO);

            // Emit data if VIN updated ===> Vin info 
            if (latestVinData) {
                this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE,
                    latestVinData, DataEntryFormType.VEHICLE_INFO);
            }

            if (customerUpdated || latestVinData || hideDefaultErrorVal !== null) {
                const taskDetails = await this.ticketsRepository.getTicketDetails(ticketId);

                this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, taskDetails, DataEntryFormType.TICKET_INFO);
            }

            // ACTIVITY LOG 
            const changes: any[] = [];
            let data: ActivityLogPayload[] = [];

            if (vinInfo?.vinNumber && checkBasicInfoDetails?.ticket?.vinInfo?.vinNumber !== vinInfo?.vinNumber) {
                data.push({
                    userId,
                    actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                    ticketId,
                    fieldName: 'VIN',
                    newData: vinInfo?.vinNumber,
                    oldData: checkBasicInfoDetails?.ticket?.vinInfo.vinNumber,
                    formType: DataEntryFormType.BASIC_INFO_ACTIVITY
                })
            }
            if (isUpdate) {
                let newBasicInfo: any = { ...latestBasicInfo };
                const unwantedKeys = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'ticketId', "ticket", "customerContacts", "transactionType", "customer"];
                if (skipEditTaskCustomer) {
                    unwantedKeys.push('customerId');
                }
                unwantedKeys.forEach(key => delete newBasicInfo[key]);

                for (let key in newBasicInfo) {
                    if (checkBasicInfoDetails[key] !== newBasicInfo[key]) {
                        let fieldName, oldValue, newValue;
                        switch (key) {
                            case "customerId":
                                fieldName = "customer";
                                oldValue = checkBasicInfoDetails?.customerId ? checkBasicInfoDetails?.customer?.name : null;
                                newValue = latestBasicInfo?.customerId ? latestBasicInfo?.customer?.name : null;
                                break;
                            case "customerContactInfoId":
                                fieldName = "customer contact";
                                oldValue = checkBasicInfoDetails?.customerContactInfoId ? checkBasicInfoDetails?.customerContacts?.name : null;
                                newValue = latestBasicInfo?.customerContactInfoId ? latestBasicInfo?.customerContacts?.name : null;
                                break;
                            case "transactionTypeId":
                                fieldName = "transaction type";
                                oldValue = checkBasicInfoDetails?.transactionTypeId ? checkBasicInfoDetails?.transactionType?.name : null;
                                newValue = latestBasicInfo?.transactionTypeId ? latestBasicInfo?.transactionType?.name : null;
                                break;
                            case "customerTransactionType":
                                fieldName = "customer transaction type";
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key];
                                break;
                            case "isTitle":
                                fieldName = "Title";
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key]
                                break;
                            case "isRegistration":
                                fieldName = "Registration";
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key]
                                break;
                            case "isIrp":
                                fieldName = "IRP";
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key]
                                break;
                            case "isConditionalTitle":
                                fieldName = "Conditional title";
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key]
                                break;
                            case "client":
                            case "unit":
                                fieldName = key;
                                oldValue = checkBasicInfoDetails[key];
                                newValue = latestBasicInfo[key];
                                break;
                            default:
                                continue;
                        }
                        changes.push({ fieldName, oldValue, newValue });
                    }
                }
                if (changes.length > 0) {
                    let newData: ActivityLogPayload[] = changes.map(change => ({
                        userId: userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: !isSummary ? DataEntryFormType.BASIC_INFO_ACTIVITY
                            : DataEntryFormType.SUMMARY_BASIC_INFO_ACTIVITY
                    }));
                    data.push(...newData)
                }
            } else {
                data.push({
                    userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.BASIC_INFO_ACTIVITY
                        : DataEntryFormType.SUMMARY_BASIC_INFO_ACTIVITY
                })
            }
            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);

            return latestBasicInfo;
        } catch (error) {
            throwException(error);
        }
    }

    async getBasicInfo(id) {
        try {
            const data: any = await this.manager.createQueryBuilder(BasicInfo, "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .leftJoinAndSelect("basicInfo.customerContacts", "customerContacts")
                .leftJoinAndSelect("basicInfo.ticket", "ticket")
                .leftJoinAndSelect("ticket.customer", "ticketCustomer")
                .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", "ticketDocuments.isDeleted = false")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("vinInfo.vinMaster", "vinMaster")
                .select([
                    "basicInfo.id", "basicInfo.client", "basicInfo.unit", "basicInfo.transactionTypeId", "basicInfo.ticketId", "basicInfo.customerContactInfoId", "basicInfo.customerId", "basicInfo.customerTransactionType", "basicInfo.isTitle", "basicInfo.isRegistration", "basicInfo.isIrp", "basicInfo.isConditionalTitle",
                    "ticket.startDate", "ticket.id", "ticket.invoiceId", "ticket.customerId",
                    "ticketCustomer.id", "ticketCustomer.name", "ticketCustomer.isDeleted",
                    "vinInfo.vinNumber", "vinInfo.hideDefaultError",
                    "transactionType.id", "transactionType.name", "transactionType.isDeleted",
                    "customer.id", "customer.name", "customer.isDeleted", "customer.billingNote",
                    "customerContacts.id", "customerContacts.name", "customerContacts.role",
                    "customerContacts.isDeleted",
                    "ticketDocuments.id", "ticketDocuments.fileName", "ticketDocuments.description", "ticketDocuments.isSigned",
                    "vinMaster.error"
                ])
                .where(`(ticket.id = :id)`, { id })
                .orderBy('ticketDocuments.id', 'ASC')
                .getOne();

            return data;
        } catch (error) {
            throwException(error);
        }
    }
}

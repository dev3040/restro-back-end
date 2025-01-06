import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TicketsRepository } from "./ticket-management.repository";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { GlobalSearchPageQueryDto, PageQueryDto } from "./dto/list-query.dto";
import { SetAssigneeDto } from "./dto/set-assignee.dto";
import { checkCarrierTypeExists, checkCustomerExists, checkDepartmentExists, checkDocumentExists, checkPriorityExists, checkTagExists, checkTicketExists, checkTicketNullValues, checkTicketStatusExists, checkTicketTeamExists, checkTidTypeExists, checkUserExists, checkValidDateReceived, findTicket, findTicketsByTicketIds, generateInvoiceId, getAllUserIds, getCarrierTypeEmail, getPriorityData, getStatusFromSlug, getTicketStatusData } from 'src/shared/utility/common-function.methods';
import { ListUsersForTicketDto } from "./dto/list-users-for-ticket.dto";
import { TicketDocuments } from "src/shared/entity/ticket-documents.entity";
import { AddTicketsDto } from "./dto/add-ticket.dto";
import { ListTagsDto } from "./dto/list-tags.dto";
import { AddTicketTagDto } from "./dto/add-ticket-tag.dto";
import { UpdateDataFieldTypesEnum, RemoveAssignedDataFieldEnum } from 'src/shared/enums/general-dto-fields.enum';
import { UploadDocumentsDto } from './dto/upload-doc.dto';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { documentPath, fedExBatchPath, fedExReturnPath } from 'src/config/common.config';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { TicketAssignedUsers } from 'src/shared/entity/ticket-assigned-users.entity';
import { editFileName, pathExistence } from 'src/shared/helper/file-validators';
import { SetTicketDetailsDto } from './dto/set-ticket-details.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { DataEntryFormType, FormType } from 'src/shared/enums/form-type.enum';
import { VinInfoRepository } from '../vin-info/vin-info.repository';
import { BasicInfoRepository } from '../basic-info/basic-info.repository';
import { SetDocumentDescriptionDto } from './dto/set-media-description.dto';
import { BillingInfoRepository } from '../billing-info/billing-info-repository';
import { Tickets } from 'src/shared/entity/tickets.entity';
import { TransactionReturnTypeEnum } from 'src/shared/enums/transaction-return-type.enum';
import moment from 'moment';
import { In } from 'typeorm';
import { SlugConstants } from 'src/shared/constants/common.constant';
import { RemoveAssignedDataDto } from './dto/remove-assigned-data.dto';
import { TicketTags } from 'src/shared/entity/ticket-tags.entity';
import { TicketStatuses } from 'src/shared/entity/ticket-statuses.entity';
import { Customers } from 'src/shared/entity/customers.entity';
import { CarrierTypes } from 'src/shared/entity/carrier-types.entity';
import { PriorityTypes } from 'src/shared/entity/priority-types.entity';
import { TidTypes } from 'src/shared/entity/tid-types.entity';
import { Departments } from 'src/shared/entity/departments.entity';
import { SetMultipleTicketsMappingDataDto } from './dto/set-mapping-data-bulk.dto';
import { Tags } from 'src/shared/entity/tags.entity';
import { FedExDocuments } from 'src/shared/entity/fedex-labels.entity';
import { BasicInfo } from 'src/shared/entity/basic-info.entity';
import { AddActivityDto } from './dto/add-activity.dto';
import { ActivityTypesEnum } from 'src/shared/enums/activity-type.enum';
import { ActivityLogsRepository } from '../activity-logs/activity-logs.repository';


@Injectable()
export class TicketManagementService {
    constructor(
        @InjectRepository(TicketsRepository)
        private readonly ticketsRepository: TicketsRepository,
        private activityLogService: ActivityLogsService,
        private vinInfoRepository: VinInfoRepository,
        private socketGateway: SocketGateway,
        private basicInfoRepository: BasicInfoRepository,
        private billingInfoRepository: BillingInfoRepository,
        private activityLogRepository: ActivityLogsRepository

    ) { }

    async addTicket(addTickets: AddTicketsDto, user: User, files): Promise<AppResponse> {
        try {
            if (files.length > 30) {
                throw new Error("ERR_MAX_FILES");
            }
            const { transactionType } = addTickets;
            const createTicket = await this.ticketsRepository.addTicket(addTickets, user.id);
            const basicInfo = await BasicInfo.create({ ticketId: createTicket.id, ...transactionType })
            await BasicInfo.save(basicInfo)
            const data: ActivityLogPayload = {
                userId: user.id,
                actionType: ActivityLogActionType.TICKET_CREATION,
                ticketId: createTicket?.id,
                fieldName: null,
                newData: null,
                oldData: null,
                formType: null
            }
            this.activityLogService.addActivityLog(data, [], null);

            if (files.length > 0) {
                const { description } = addTickets;
                if (description && description.length != files.length) {
                    throw new ConflictException("ERROR_MESSAGE&&&description")
                }
                files.forEach((file, index) => {
                    file.description = description[index];
                });
                await this.uploadDocs(createTicket, files, user, FormType.TICKET_INFO_FORM);
            }

            /* *********** SEND SOCKET TRIGGER FOR LIST PAGE ********************/
            const ticketData = { ...createTicket };
            const propertiesToDelete = [
                'ticketId', 'createdAt', 'createdBy', 'updatedBy', 'updatedAt', 'invoiceId',
                'isDeleted', 'isActive', 'endDate', 'sentToDmvAt', 'sentToDmvBy', 'purchaseDate',
                'basicInfo', 'basicInfo'

            ];
            propertiesToDelete.forEach(property => { delete ticketData[property]; });

            // channel = user_id, event = "list_new_ticket", data = new ticket 
            const users = await getAllUserIds();
            if (users.length) {
                //New ticket socket event
                for (const elem of users) {
                    this.socketGateway.notify(elem, SocketEventEnum.LIST_NEW_TICKET, ticketData);
                }
                //analytics count socket event
                await this.ticketAnalyticsSocketEvent(users);
            }

            return {
                message: "SUC_TICKET_CREATED",
                data: createTicket
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketList(query: PageQueryDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.fetchAllTickets(query, userId);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketListTest(query: PageQueryDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.fetchAllTicketsTest(query, userId);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    //need to delete later
    async testTicket(query: PageQueryDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.fetchAllTicketsOld(query, userId);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch tickets details from ID
     * @param id  => Tickets id
     */
    async getTicket(id): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getTicketDetails(id)

            return {
                message: "SUC_TICKET_DETAILS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketDocs(ticketId, query): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getTicketDocs(ticketId, query)

            return {
                message: "SUC_TASK_DOCUMENT_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    //need to delete later
    async updateTicketData(dto, ticketId: number, userId: number): Promise<AppResponse> {
        try {
            const { type, id } = dto;

            //check ticket exists or not
            const ticket = await this.ticketsRepository.findOne({
                select: ['priorityId', 'ticketStatusId'],
                where: {
                    id: ticketId,
                    isDeleted: false
                }
            })
            if (!ticket) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&ticketId&&&ERROR_MESSAGE`)
            }

            const fieldName = type.replace('update_', '');
            let newData = null;
            let oldData = null;
            let updateData: any = {};

            if (type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY && ticket.priorityId === id ||
                type === UpdateDataFieldTypesEnum.UPDATE_STATUS && ticket.ticketStatusId === id) {
                throw new BadRequestException(`ERR_NO_CHANGES_DETECTED&&&updateTicketData&&&ERROR_MESSAGE`)
            }

            //get data for old values 
            if (type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY && ticket?.priorityId) {
                const oldPriority = await getPriorityData(ticket.priorityId);
                if (oldPriority) {
                    oldData = {
                        value: oldPriority?.name,
                        color: oldPriority?.colorCode,
                    };
                }
            }
            if (type === UpdateDataFieldTypesEnum.UPDATE_STATUS) {
                const oldTicketStatus = await getTicketStatusData(ticket.ticketStatusId);
                oldData = oldTicketStatus?.internalStatusName;
            }

            //get data for new values
            if (id !== null) {
                switch (type) {
                    case UpdateDataFieldTypesEnum.UPDATE_PRIORITY: {
                        const priority = await checkPriorityExists(id);
                        newData = {
                            value: priority.name,
                            color: priority.colorCode,
                        }
                        break;
                    }
                    case UpdateDataFieldTypesEnum.UPDATE_STATUS: {
                        const ticketStatus = await checkTicketStatusExists(id, true);
                        newData = ticketStatus?.internalStatusName;

                        // set additional fields for "Sent to DMV" status
                        if (ticketStatus?.slug === SlugConstants.ticketStatusSentToDmv) {
                            dto.sentToDmvBy = userId;
                            dto.sentToDmvAt = new Date();
                        }
                        break;
                    }
                }
            }

            // prepare data to update
            updateData = {
                updatedBy: userId,
                ...(type === UpdateDataFieldTypesEnum.UPDATE_STATUS && {
                    ticketStatusId: id,
                    sentToDmvBy: dto.sentToDmvBy,
                    sentToDmvAt: dto.sentToDmvAt,
                }),
                ...(type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY && { priorityId: id }),
            };
            await this.ticketsRepository.updateTicketData(updateData, ticketId);

            //activity log
            const data: ActivityLogPayload = {
                userId,
                actionType: ActivityLogActionType.TICKET_DATA_UPDATE,
                ticketId,
                fieldName,
                newData,
                oldData,
                formType: null
            }
            this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_UPDATE);

            //analytics count socket event
            await this.ticketAnalyticsSocketEvent([userId]);

            return {
                message: "SUC_TICKET_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    //In use to set assignee from [edit task] screen for the particular ticket
    async setAssignee(setAssignee: SetAssigneeDto, logInUserId: number): Promise<AppResponse> {
        try {
            const { ticketId, userId } = setAssignee;

            await checkTicketExists(ticketId); //check ticket
            await checkUserExists(userId); //check user

            const isAssigneeAdded = await this.ticketsRepository.setAssignee(setAssignee, userId);

            // Emit data ====> ticket data 
            const latestTicketData = await this.ticketsRepository.getTicketDetails(ticketId);
            this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

            const socketAction = isAssigneeAdded ? SocketEventEnum.TICKET_DATA_ADD : SocketEventEnum.TICKET_DATA_REMOVE;

            const data = {
                userId: logInUserId,
                actionType: socketAction,
                ticketId,
                fieldName: 'assignee',
                newData: isAssigneeAdded ? `${userId}` : null,
                oldData: isAssigneeAdded ? null : `${userId}`,
                formType: null
            }
            this.activityLogService.addActivityLog(data, [], socketAction)

            const users = await TicketAssignedUsers.createQueryBuilder("ticketAssignedUsers")
                .leftJoinAndSelect("ticketAssignedUsers.assignedUser", "assignedUser", "assignedUser.isDeleted = false")
                .select(["ticketAssignedUsers.userId", "assignedUser.id", "assignedUser.firstName", "assignedUser.lastName", "assignedUser.isDeleted"])
                .where(`ticketAssignedUsers.ticketId = :ticketId`, { ticketId })
                .getMany();

            const userArr = users.length ? users.map(element => element.assignedUser) : [];
            return {
                message: isAssigneeAdded ? 'SUC_TICKET_ASSIGNEE_ADDED_SUCCESSFULLY'
                    : 'SUC_TICKET_ASSIGNEE_REMOVED_SUCCESSFULLY',
                data: userArr
            };
        } catch (error) {
            throwException(error);
        }
    }

    async listUsersForTicket(query: ListUsersForTicketDto): Promise<AppResponse> {
        try {
            if (query.ticketId)
                await checkTicketExists(query.ticketId);

            const data = await this.ticketsRepository.fetchAllUsersForTicket(query);

            return {
                message: "SUC_USER_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async listTags(query: ListTagsDto): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.fetchAllTags(query);

            return {
                message: "SUC_TAG_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async listTicketTags(ticketId): Promise<AppResponse> {
        try {
            await checkTicketExists(ticketId);

            const data = await this.ticketsRepository.fetchAllTicketTags(ticketId);

            return {
                message: "SUC_TICKET_TAGS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteTicketTag(ticketId: number, tagId: number, userId: number): Promise<AppResponse> {
        try {
            //remove tag
            await this.ticketsRepository.deleteTicketTag(tagId, ticketId, [])

            // Emit data ====> ticket data 
            const latestTicketData = await this.ticketsRepository.getTicketDetails(ticketId);
            this.socketGateway.formDataUpdatedEvent(
                ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

            //activity log
            const tag = await checkTagExists(tagId);
            const data: ActivityLogPayload = {
                userId,
                actionType: ActivityLogActionType.TICKET_DATA_REMOVE,
                ticketId,
                fieldName: 'flag',
                newData: null,
                oldData: tag?.name,
                formType: null
            }
            this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_REMOVE);

            return {
                message: "SUC_TICKET_TAG_REMOVED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async addTicketTag(addTicketTagDto: AddTicketTagDto, userId: number): Promise<AppResponse> {
        try {
            const { data, tag } = await this.ticketsRepository.addTicketTag(addTicketTagDto, userId);

            /* Emit data ====> ticket data */
            const latestTicketData = await this.ticketsRepository.getTicketDetails(data?.ticketId);
            this.socketGateway.formDataUpdatedEvent(
                data?.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

            //add activity log
            this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_ADD);

            return {
                message: "SUC_TAG_CREATED",
                data: addTicketTagDto?.tag ? tag : {}
            };
        } catch (error) {
            throwException(error)
        }
    }

    async getFormsDetail(ticketId): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getFormsDetail(ticketId)

            return {
                message: "SUC_FORM_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async setTicketDetails(setTicketDto: SetTicketDetailsDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            let isUpdate: boolean;
            let ticketDetails: any;
            let ticket_id: number;
            let oldTicketData: Tickets;
            let ticketStatus: TicketStatuses;
            let customer: Customers;
            let carrierType: CarrierTypes;
            let priority: PriorityTypes;
            let tidType: TidTypes;
            let assignedDepartment: Departments;
            let newVin;
            let latestVinData;
            let autoUpdateStatusLog: ActivityLogPayload;
            let findInprogressStatus: TicketStatuses;
            let autoUpdateStatus: boolean = false;
            let customerUpdated: boolean = false;

            if (setTicketDto?.ticketId) {
                oldTicketData = await this.ticketsRepository.getTicketDetails(setTicketDto?.ticketId);
            }
            if (setTicketDto?.ticketStatusId) {
                ticketStatus = await checkTicketStatusExists(setTicketDto.ticketStatusId, true);
            }
            if (setTicketDto?.customerId) {
                customer = await checkCustomerExists(setTicketDto.customerId);
            }
            if (setTicketDto?.carrierTypesId) {
                carrierType = await checkCarrierTypeExists(setTicketDto.carrierTypesId);
            }
            if (setTicketDto?.priorityId) {
                priority = await checkPriorityExists(setTicketDto.priorityId);
            }
            if (setTicketDto?.tidTypeId) {
                tidType = await checkTidTypeExists(setTicketDto.tidTypeId)
            }
            if (setTicketDto.assignedToDeptId) {
                assignedDepartment = await checkDepartmentExists(setTicketDto.assignedToDeptId)
            }
            if (setTicketDto?.docReceivedDate) {
                checkValidDateReceived(setTicketDto.docReceivedDate)
            }

            //vin details
            let vinId = oldTicketData.vinId || null;
            if (setTicketDto?.vinInfo) {
                //check is hideDefaultError provided

                const { vinError } = setTicketDto;
                const getVin = await this.ticketsRepository.checkVinData(setTicketDto?.vinInfo?.vinNumber);

                if (!getVin) {
                    newVin = await this.ticketsRepository.createVinInfo(setTicketDto?.vinInfo, null, vinError, setTicketDto?.hideDefaultError);
                    vinId = newVin.id;
                } else {
                    newVin = await this.ticketsRepository.createVinInfo(getVin, getVin.id, null, setTicketDto?.hideDefaultError);
                    vinId = newVin.id;
                }
                delete setTicketDto.vinError;
            }
            if (vinId) {
                latestVinData = await this.vinInfoRepository.getVinData(vinId, setTicketDto?.ticketId);
            }

            //set ticket details
            if (setTicketDto?.ticketId) {
                //check ticket exists with given id
                ticket_id = setTicketDto.ticketId;


                //received date time validation
                if (oldTicketData?.docReceivedDate && setTicketDto?.docReceivedDate === null) {
                    throw new BadRequestException(`ERR_TICKET_DATE_RECEIVED_REQUIRED&&&docReceivedDate`);
                }
                //purchase date validation
                if (oldTicketData?.purchaseDate && setTicketDto?.purchaseDate === null) {
                    throw new BadRequestException(`ERR_TICKET_PURCHASE_DATE_REQUIRED&&&purchaseDate`);
                }

                if (setTicketDto?.customerId !== undefined && setTicketDto?.customerId !== oldTicketData?.customerId) {
                    customerUpdated = true;
                }

                delete setTicketDto.ticketId;
                delete setTicketDto.vinInfo;
                delete setTicketDto?.hideDefaultError;

                // Update the existing record
                const updateData = {
                    ...setTicketDto,
                    vinId: latestVinData?.id,
                    updatedBy: userId,
                    ...(ticketStatus?.slug === SlugConstants.ticketStatusSentToDmv && {
                        sentToDmvAt: new Date(),
                        sentToDmvBy: userId,
                    }),
                };

                /* Auto update status 
                [If start date in db = NULL & date provided in startDate field in request;
                then need to auto update status from 'Open received request' to 'In process'] */
                if (oldTicketData?.ticketStatus?.slug === SlugConstants.ticketStatusOpenReceivedReq
                    &&
                    oldTicketData?.startDate === null && setTicketDto?.startDate !== null) {

                    findInprogressStatus = await getStatusFromSlug(SlugConstants.ticketStatusInprogress);
                    if (findInprogressStatus) {
                        autoUpdateStatus = true;

                        updateData.ticketStatusId = findInprogressStatus.id;
                        autoUpdateStatusLog = {
                            fieldName: 'status',
                            ticketId: ticket_id,
                            actionType: ActivityLogActionType.AUTO_UPDATE,
                            newData: findInprogressStatus?.internalStatusName,
                            formType: null,
                            userId: null,
                            oldData: null
                        }
                    }
                }
                //update data
                await this.ticketsRepository.update(ticket_id, updateData);
                isUpdate = true;

            } else {
                const ticketCount = await this.ticketsRepository.getTicketCount();
                const invoiceId = await generateInvoiceId(ticketCount);
                if (!setTicketDto?.ticketStatusId) {
                    throw new BadRequestException(`ERR_TICKET_STATUS_REQUIRED&&&ticketStatusId`)
                }
                delete setTicketDto.vinInfo;

                // Create a new record
                const tData = {
                    ...setTicketDto,
                    vinId: latestVinData?.id,
                    invoiceId: invoiceId,
                    createdBy: userId,
                    ...(ticketStatus?.slug === SlugConstants.ticketStatusSentToDmv && {
                        sentToDmvAt: new Date(),
                        sentToDmvBy: userId,
                    }),
                };

                ticketDetails = this.ticketsRepository.create(tData)
                const newTicket = await this.ticketsRepository.save(ticketDetails);

                ticket_id = newTicket.id;
                isUpdate = false;
            }

            const latestTicketData = await this.ticketsRepository.getTicketDetails(ticket_id);

            //Emit data ====> ticket data 
            this.socketGateway.formDataUpdatedEvent(
                ticket_id, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

            // Emit data ===>>>> VIN details [vehicle + basic]
            //vehicle info
            // if (latestVinData && oldTicketData && oldTicketData?.vinId !== latestVinData?.id) {
            this.socketGateway.formDataUpdatedEvent(ticket_id, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinData, DataEntryFormType.VEHICLE_INFO);

            //basic info
            const basicInfo = await this.basicInfoRepository.getBasicInfo(ticket_id);
            if (basicInfo) {
                this.socketGateway.formDataUpdatedEvent(ticket_id, SocketEventEnum.FORM_DETAILS_UPDATE, basicInfo, DataEntryFormType.BASIC_INFO);
            }
            // }

            // Emit data ===>>>> ticket's customer details [ basic]
            if (customerUpdated || latestVinData) {

                if (customerUpdated) {
                    const dto: any = { customerId: setTicketDto?.customerId, ticketId: ticket_id };
                    await this.basicInfoRepository.setBasicInfo(dto, userId, false, true);
                }
                const latestBasicInfo = await this.basicInfoRepository.getBasicInfo(ticket_id);
                if (latestBasicInfo) {
                    this.socketGateway.formDataUpdatedEvent(latestTicketData.customerId,
                        SocketEventEnum.FORM_DETAILS_UPDATE, latestBasicInfo, DataEntryFormType.BASIC_INFO);
                }
            }

            if (isUpdate) {
                // If ticket status is not Quote then need to find & show missing fields count 
                let nullFieldCount;
                if (latestTicketData?.ticketStatus?.slug === SlugConstants.ticketStatusQuote) {
                    nullFieldCount = {
                        statusSlug: SlugConstants.ticketStatusQuote
                    }
                } else {
                    const missingDataDto: any = {
                        customerId: latestTicketData.customerId,
                        ticketStatusId: latestTicketData.ticketStatusId,
                        carrierTypesId: latestTicketData.carrierTypesId,
                        assignedToDeptId: latestTicketData.assignedToDeptId,
                        tidTypeId: latestTicketData.tidTypeId,
                    }

                    if (latestTicketData?.carrierTypesId) {
                        const data = await getCarrierTypeEmail(latestTicketData.carrierTypesId);
                        if (!data) {
                            missingDataDto.trackingId = latestTicketData.trackingId === '' ? null : latestTicketData.trackingId;
                        }
                    }
                    nullFieldCount = await checkTicketNullValues(missingDataDto, latestTicketData?.ticketStatus?.slug)
                }

                //channel = ticketId, event = "missing_ticket_details", data = count of null values
                this.socketGateway.notify(ticket_id, SocketEventEnum.MISSING_TICKET_DETAILS, nullFieldCount);

                //assign ticket to logged in user is not a assignee
                await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticket_id, userId);

                //activity log
                let changes: any[] = [];
                const newTicketData = { ...latestTicketData };

                const propertiesToDelete = [
                    'id', 'isStateTransfer', 'dateReceived', 'createdAt', 'createdBy', 'updatedBy', 'updatedAt', 'invoiceId', 'isDeleted', 'isActive', 'endDate', 'sentToDmvAt', 'sentToDmvBy', 'ticketDocument', 'priority', 'customer', 'carrierType', 'ticketTag', 'ticketStatus', 'vinInfo', 'tidTypeData', 'ticketAssignedUser', 'department',
                    'fedExDocuments', 'sentToBatchPrep', 'basicInfo'
                ];
                if (autoUpdateStatus === true) {
                    propertiesToDelete.push('ticketStatusId')
                }
                propertiesToDelete.forEach(property => { delete newTicketData[property]; });

                // Iterate through keys and check for changes
                for (const key in newTicketData) {
                    if (oldTicketData[key] !== newTicketData[key]) {
                        if (key === "customerId") {
                            changes.push({
                                fieldName: "customer",
                                oldValue: oldTicketData?.customer?.name,
                                newValue: customer?.name
                            });
                        } else if (key === "priorityId") {
                            const old_value = !oldTicketData?.priority ? null : {
                                value: oldTicketData?.priority?.name,
                                color: oldTicketData?.priority?.colorCode
                            };
                            const new_value = !setTicketDto?.priorityId ? null : {
                                value: priority?.name,
                                color: priority?.colorCode
                            };
                            changes.push({
                                fieldName: "priority",
                                oldValue: old_value,
                                newValue: new_value
                            });
                        } else if (key === "vinId" && (
                            (oldTicketData?.vinInfo?.vinNumber).toLowerCase() !== (newVin?.vinNumber).toLowerCase()
                        )) {
                            changes.push({
                                fieldName: "VIN",
                                oldValue: oldTicketData?.vinInfo?.vinNumber,
                                newValue: newVin?.vinNumber
                            });

                        } else if (key === "carrierTypesId") {
                            changes.push({
                                fieldName: "carrier",
                                oldValue: oldTicketData?.carrierType?.name,
                                newValue: carrierType?.name
                            });
                        } else if (key === "ticketStatusId") {
                            changes.push({
                                fieldName: "status",
                                oldValue: oldTicketData?.ticketStatus?.internalStatusName,
                                newValue: ticketStatus?.internalStatusName
                            });
                        } else if (key === "tidTypeId") {
                            changes.push({
                                fieldName: "tid type",
                                oldValue: oldTicketData?.tidTypeData?.name,
                                newValue: tidType?.name
                            });
                        } else if (key === "assignedToDeptId") {
                            changes.push({
                                fieldName: "team",
                                oldValue: oldTicketData?.department?.name,
                                newValue: assignedDepartment?.name
                            });
                        } else if (key === "trackingId") {
                            changes.push({
                                fieldName: "tracking id",
                                oldValue: oldTicketData?.trackingId,
                                newValue: setTicketDto?.trackingId
                            });
                        } else if (key === "purchaseDate") {
                            changes.push({
                                fieldName: "purchase date",
                                oldValue: oldTicketData?.purchaseDate,
                                newValue: setTicketDto?.purchaseDate
                            });
                        } else if (key === "docReceivedDate") {
                            const oldDate = moment(oldTicketData.docReceivedDate).format('YYYY-MM-DD');
                            const newDate = moment(newTicketData.docReceivedDate).format('YYYY-MM-DD');

                            // Compare the dates directly
                            if (oldDate !== newDate) {
                                changes.push({
                                    fieldName: "date time",
                                    oldValue: oldDate,
                                    newValue: newDate
                                });
                            }
                        } else if (key === "startDate") {
                            if (oldTicketData?.startDate && newTicketData?.startDate && oldTicketData?.startDate !== newTicketData?.startDate)
                                changes.push({
                                    fieldName: "start date",
                                    oldValue: oldTicketData?.startDate,
                                    newValue: newTicketData?.startDate
                                });
                        } else {
                            changes.push({
                                fieldName: key,
                                oldValue: oldTicketData[key],
                                newValue: newTicketData[key]
                            });
                        }
                    }
                }
                //auto update status log
                let activityLogs: ActivityLogPayload[] = [];
                if (changes.length > 0) {
                    activityLogs = changes.map(change => ({
                        userId,
                        actionType: ActivityLogActionType.TICKET_DATA_UPDATE,
                        ticketId: ticket_id,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: !isSummary ? null : DataEntryFormType.SUMMARY_TICKET_ACTIVITY
                    }));
                }
                if (autoUpdateStatusLog) {
                    activityLogs.push(autoUpdateStatusLog)
                }
                if (activityLogs.length) {
                    this.activityLogService.addActivityLog(activityLogs, [], SocketEventEnum.TICKET_DATA_UPDATE);
                }
            } else {
                // ticket creation flow

                // *********** SEND SOCKET TRIGGER FOR LIST PAGE ********************
                const ticketData = { ...latestTicketData };
                const propertiesToDelete = [
                    'ticketId', 'createdAt', 'createdBy', 'updatedBy', 'updatedAt', 'invoiceId',
                    'isDeleted', 'isActive', 'endDate', 'sentToDmvAt', 'sentToDmvBy', 'purchaseDate', 'basicInfo'
                ];
                propertiesToDelete.forEach(property => { delete ticketData[property]; });

                // channel = user_id, event = "list_new_ticket", data = new ticket 
                const users = await getAllUserIds();
                if (users.length) {
                    for (const elem of users) {
                        this.socketGateway.notify(elem, SocketEventEnum.LIST_NEW_TICKET, ticketData);
                    }
                }


                //add ticket creation activity log
                const data: ActivityLogPayload = {
                    userId,
                    actionType: ActivityLogActionType.TICKET_CREATION,
                    ticketId: ticket_id,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: null
                }
                this.activityLogService.addActivityLog(data, [], null);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticket_id, userId);

            return {
                message: isUpdate ? "SUC_TICKET_UPDATED" : "SUC_TICKET_CREATED",
                data: latestTicketData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDocument(deleteDocument, userId: number, query): Promise<any> {
        try {

            const getDocument = await TicketDocuments.find({ where: { id: In(deleteDocument.ids), isDeleted: false }, select: ["ticketId", "fileName"] });

            if (query.isBilling) {
                const data = await TicketDocuments.update({ id: In(deleteDocument.ids) }, { isBillingDocDelete: true });
                /* Emit data ====>  ticket */
                const latestTicketData = await this.ticketsRepository.getTicketDetails(getDocument[0].ticketId, query.isBilling == "true");
                this.socketGateway.formDataUpdatedEvent(getDocument[0].ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);
                return data
            }
            const response = await this.ticketsRepository.deleteDocuments(deleteDocument, userId);
            let docData = [];
            for (let element of getDocument) {
                docData.push({
                    userId: userId,
                    actionType: ActivityLogActionType.TICKET_DATA_REMOVE,
                    ticketId: getDocument[0].ticketId,
                    fieldName: 'document',
                    newData: element.fileName,
                    oldData: null,
                })
            }
            if (docData.length) {
                this.activityLogService.addActivityLog(docData, [], SocketEventEnum.TICKET_DATA_REMOVE);
            }
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    async downloadDocument(id, res, query) {
        try {
            let getDocument;
            let folderPath;
            if (query.isFedExLabel == 'true') {
                getDocument = await FedExDocuments.findOne({ where: { id } });
                if (!getDocument) {
                    throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
                }
                if (getDocument.ticketId) {
                    folderPath = fedExReturnPath(getDocument.ticketId);
                } else if (getDocument.batchId) {
                    folderPath = fedExBatchPath(getDocument.batchId);
                }
            } else {
                getDocument = await TicketDocuments.findOne({ where: { id } });
                if (!getDocument) {
                    throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
                }
                folderPath = `${documentPath}/${getDocument.ticketId}`;
            }

            const fullPath = path.join(process.cwd(), folderPath, getDocument.fileName);
            if (!fs.existsSync(fullPath)) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id');
            }
            return res.sendFile(fullPath);

        } catch (error) {
            throwException(error);
        }
    }

    async uploadDocuments(id, user, files, upload: UploadDocumentsDto) {
        try {
            const { description } = upload;
            if (files?.length > 30) {
                throw new Error("ERR_MAX_FILES");
            }
            const ticket = await checkTicketExists(id)

            if (files.length > 0) {
                if (description && description.length != files.length) {
                    throw new ConflictException("ERROR_MESSAGE&&&description")
                }
                files.forEach((file, index) => {
                    file.description = description[index];
                    file.isSigned = upload.isSigned;
                    file.isBillingDoc = upload.isBillingDoc
                });
                const docForm = upload?.formType ? upload?.formType : FormType.TICKET_INFO_FORM
                await this.uploadDocs(ticket, files, user, docForm);
            }

            return {
                message: "SUC_DOC_UPLOADED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async uploadDocs(ticket, files, user: User, formType) {
        try {
            const uploadedFiles = [];
            for (const file of files) {
                let fileName = editFileName(file);
                if (file.mimetype === 'image/jpeg' && fileName.endsWith('.jpeg')) {
                    fileName = fileName.replace('.jpeg', '.jpg');
                }

                const folderPath = `${documentPath}/${ticket.id}`;
                const filePath = path.join(process.cwd(), folderPath, fileName);

                await pathExistence(filePath);
                fs.writeFileSync(filePath, file.buffer);

                uploadedFiles.push({
                    ticketId: ticket.id,
                    fileName: fileName,
                    filePath: filePath,
                    createdBy: user.id,
                    description: file.description,
                    isSigned: file.isSigned,
                    isBillingDoc: file.isBillingDoc
                });
            }

            await TicketDocuments.createQueryBuilder()
                .insert()
                .into(TicketDocuments)
                .values(uploadedFiles)
                .execute();

            let docData = [];
            let actionType;
            let socketEvent;
            let fType;
            switch (formType) {
                case FormType.BILLING_INFO_FORM:
                    actionType = ActivityLogActionType.FORM_DATA_ADD;
                    socketEvent = SocketEventEnum.FORM_DATA_UPDATE;
                    fType = DataEntryFormType.BILLING_INFO_ACTIVITY
                    break;
                case FormType.BASIC_INFO_FORM:
                    actionType = ActivityLogActionType.FORM_DATA_ADD;
                    socketEvent = SocketEventEnum.FORM_DATA_UPDATE;
                    fType = DataEntryFormType.BASIC_INFO_ACTIVITY
                    break;
                case FormType.SIGNED_DOCUMENT:
                    actionType = ActivityLogActionType.FORM_DATA_ADD;
                    socketEvent = SocketEventEnum.FORM_DATA_UPDATE;
                    fType = DataEntryFormType.SIGNED_DOCUMENT_ACTIVITY
                    break;
                case FormType.BILLING_PROCESS:
                    actionType = ActivityLogActionType.FORM_DATA_ADD;
                    socketEvent = SocketEventEnum.FORM_DATA_UPDATE;
                    fType = DataEntryFormType.BILLING_PROCESS_ACTIVITY
                    break;
                default:
                    actionType = ActivityLogActionType.TICKET_DATA_ADD;
                    socketEvent = SocketEventEnum.TICKET_DATA_ADD;
                    fType = DataEntryFormType.TICKET_INFO
            }

            for (let element of uploadedFiles) {
                docData.push({
                    userId: user.id,
                    formType: fType,
                    actionType: actionType,
                    ticketId: ticket.id,
                    fieldName: 'document',
                    newData: element.fileName,
                    oldData: null,
                })
            }
            if (docData.length) {
                this.activityLogService.addActivityLog(docData, [], socketEvent);
            }
            /* Emit data ====>  ticket */
            const latestTicketData = await this.ticketsRepository.getTicketDetails(ticket.id, uploadedFiles.some(v => v.isBillingDoc));
            this.socketGateway.formDataUpdatedEvent(ticket.id, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);
            /* Emit data ====>> Basic info*/
            const latestBasicInfo = await this.basicInfoRepository.getBasicInfo(ticket.id);
            if (latestBasicInfo) {
                this.socketGateway.formDataUpdatedEvent(ticket.id, SocketEventEnum.FORM_DETAILS_UPDATE, latestBasicInfo, DataEntryFormType.BASIC_INFO);
            }
            /* Emit data ====>> Billing info*/
            const latestBillingInfo = await this.billingInfoRepository.getBillingInfo(ticket.id);
            if (latestBillingInfo) {
                this.socketGateway.formDataUpdatedEvent(ticket.id, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingInfo, DataEntryFormType.BILLING_INFO);
            }
        } catch (error) {
            throwException(error);
        }
    }

    async uploadLabels(pdfResponse, ticket, user) {
        try {
            const { label: pdf, ...payload } = pdfResponse;
            const fileName = editFileName({ originalname: "return-label.pdf" });
            const folderPath = path.join(process.cwd(), fedExReturnPath(ticket.id));
            const filePath = path.join(folderPath, fileName);

            // Ensure the directory exists
            await pathExistence(filePath);

            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                pdf.data.pipe(writeStream);

                pdf.data.on('end', resolve);
                pdf.data.on('error', reject);
            });

            await FedExDocuments.createQueryBuilder()
                .insert()
                .into(FedExDocuments)
                .values({ ticketId: ticket.id, isReturnLabel: true, fileName, createdBy: user.id, ...payload })
                .execute();

            return filePath;
        } catch (err) {
            throwException(err);
        }
    }

    async editMediaDescription(setDocumentDescriptionDto: SetDocumentDescriptionDto, documentId, userId: number): Promise<AppResponse> {
        try {
            const { description } = setDocumentDescriptionDto;

            const docExists = await checkDocumentExists(documentId)

            const oldDesc = docExists?.description || null;

            docExists.description = description;
            docExists.updatedBy = userId;
            await docExists.save();

            const ticketId = docExists.ticketId;
            const socketEvent = SocketEventEnum.FORM_DETAILS_UPDATE;

            /* Emit data ====>> Ticket + Basic info + billing info form */
            //ticket
            const latestTicketData = await this.ticketsRepository.getTicketDetails(ticketId);
            this.socketGateway.formDataUpdatedEvent(
                ticketId, socketEvent, latestTicketData, DataEntryFormType.TICKET_INFO
            );
            //basic info
            const basicInfo = await this.basicInfoRepository.getBasicInfo(ticketId);
            if (basicInfo) {
                this.socketGateway.formDataUpdatedEvent(
                    ticketId, socketEvent, basicInfo, DataEntryFormType.BASIC_INFO
                );
            }
            //billing info {for only specific transaction return type , document data needs to be emit}
            const latestBillingInfo = await this.billingInfoRepository.getBillingInfo(ticketId);
            if (latestBillingInfo?.billingInfo?.transactionReturnType == TransactionReturnTypeEnum.CUS_PROVIDED_LABEL_TO_CLIENT) {
                this.socketGateway.formDataUpdatedEvent(
                    ticketId, socketEvent, latestBillingInfo, DataEntryFormType.BILLING_INFO);
            }

            // Activity log 
            const data: ActivityLogPayload = {
                userId,
                ticketId,
                actionType: ActivityLogActionType.TICKET_DATA_UPDATE,
                fieldName: 'document description',
                newData: description,
                oldData: oldDesc,
                formType: null
            }
            this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);

            return {
                message: "SUC_DOC_DESCRIPTION_UPDATED", data: docExists
            };

        } catch (error) {
            throwException(error);
        }
    }

    async getForms(forms): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getForms(forms)
            return {
                message: "SUC_FORM_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketAnalytics(): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getTicketAnalytics();
            return {
                message: "SUC_TICKET_ANALYTICS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async stateTransfer(id, body): Promise<AppResponse> {
        try {
            const stateTransfer = await checkTicketExists(id)
            if (!stateTransfer) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND`);
            }
            stateTransfer.isStateTransfer = body?.isStateTransfer;
            await stateTransfer.save();

            return {
                message: "SUC_TICKET_CREATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getStateTransfer(id: number): Promise<AppResponse> {
        try {
            const getStateTransfer = await Tickets.findOne({
                select: ['isStateTransfer'],
                where: { id: id, isDeleted: false }
            });

            if (getStateTransfer === null) {
                return {
                    message: "SUC_STATE_TRANSFER_FETCHED",
                    data: {
                        isStateTransfer: null
                    }
                };
            }
            return {
                message: "SUC_STATE_TRANSFER_FETCHED",
                data: {
                    isStateTransfer: getStateTransfer.isStateTransfer
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Deletes one or more tickets by marking them as deleted.
     *
     * @param dto - An object containing the IDs of the tickets to be deleted.
     * @param user - The user performing the deletion operation.
     * @returns A Promise that resolves to an `AppResponse` object containing a success message and an empty data object.
     */
    async deleteTickets(dto, userId: number): Promise<AppResponse> {
        try {
            const { ticketIds } = dto
            await Tickets.createQueryBuilder()
                .update()
                .set({ isDeleted: true, updatedBy: userId })
                .whereInIds(ticketIds)
                .execute();

            //analytics count socket event
            await this.ticketAnalyticsSocketEvent([userId]);

            return {
                message: ticketIds.length === 1 ? "SUC_TICKET_UPDATED" : "SUC_TICKETS_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Removes the assigned data (assignee or tags) from a ticket.
     *
     * @param dto - An object containing the ticket ID and the field to remove (assignee or tags).
     * @param userId - The ID of the user performing the removal operation.
     * @returns A Promise that resolves to an `AppResponse` object containing a success message and an empty data object.
     */
    async removeAssignedData(dto: RemoveAssignedDataDto, userId: number): Promise<AppResponse> {
        try {
            const { ticketId, field } = dto;

            await findTicket(ticketId);

            const forAssignee = field === RemoveAssignedDataFieldEnum.ASSIGNEE ? true : false;
            let message = 'SUC_DATA_UP_TO_DATE';

            //remove data
            const repository = forAssignee
                ? this.ticketsRepository.manager.getRepository(TicketAssignedUsers)
                : this.ticketsRepository.manager.getRepository(TicketTags);

            const removedDataCount = await this.ticketsRepository.removeAllAssignedData(repository, ticketId);

            if (removedDataCount.affected > 0) {
                // Emit data ====> ticket data 
                const latestTicketData = await this.ticketsRepository.getTicketDetails(ticketId);
                this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

                //activity log
                const data = {
                    ticketId,
                    userId,
                    actionType: ActivityLogActionType.TICKET_DATA_REMOVE,
                    fieldName: forAssignee ? 'all Assignees' : 'all Flags',
                }
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_REMOVE)

                message = forAssignee ? 'SUC_ALL_ASSIGNEES_REMOVED' : 'SUC_ALL_TAGS_REMOVED'
            }
            return {
                message,
                data: {}
            };

        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Bulk update tickets with various data fields such as assignee, tag, status, priority, and team.
     *
     * @param dto - An object containing the update data, including the type of update, the ID of the entity to update, the ticket IDs to update, and whether to add or remove the update.
     * @param logInUserId - The ID of the user performing the update.
     * @returns A Promise that resolves to an `AppResponse` object containing the result of the update operation.
     */
    async bulkUpdateTickets(dto: SetMultipleTicketsMappingDataDto, logInUserId: number): Promise<AppResponse> {
        try {
            let { type, id, ticketIds, isAdd } = dto;
            ticketIds = [...new Set(ticketIds)];

            const isAddOperation = isAdd === true;
            const actionType = isAddOperation ? ActivityLogActionType.TICKET_DATA_ADD : ActivityLogActionType.TICKET_DATA_REMOVE;
            const socketEvent = isAddOperation ? SocketEventEnum.TICKET_DATA_ADD : SocketEventEnum.TICKET_DATA_REMOVE;

            // Check if tickets exist
            const findTickets = await findTicketsByTicketIds(ticketIds);
            if (findTickets !== ticketIds.length) {
                throw new BadRequestException(`ERR_TASKS_NOT_FOUND&&&ticketIds&&&ERROR_MESSAGE`);
            }

            switch (type) {
                case UpdateDataFieldTypesEnum.ASSIGNEE:
                    return await this.updateMultipleTicketsAssignee(id, ticketIds, logInUserId, actionType, socketEvent, isAddOperation);

                case UpdateDataFieldTypesEnum.TAG:
                    return await this.updateMultipleTicketsTag(id, ticketIds, logInUserId, actionType, socketEvent, isAddOperation);

                case UpdateDataFieldTypesEnum.STATUS:
                    return await this.updateMultipleTicketsStatus(id, ticketIds, logInUserId, type);

                case UpdateDataFieldTypesEnum.PRIORITY:
                    return await this.updateMultipleTicketsPriority(id, ticketIds, logInUserId, type);

                case UpdateDataFieldTypesEnum.TEAM:
                    return await this.updateMultipleTicketTeam(id, ticketIds, logInUserId, type);

                default:
                    throw new BadRequestException(`Invalid type: ${type}&&&type&&&ERROR_MESSAGE`);
            }
        } catch (error) {
            throwException(error);
        }
    }

    /**
    * Bulk update the assignee associated with multiple tickets.
    *
    * @param id - The ID of the user to update the tickets with.
    * @param ticketIds - An array of ticket IDs to update.
    * @param logInUserId - The ID of the user performing the update.
    * @param actionType - The type of action being performed (add or remove).
    * @param socketEvent - The socket event to emit after the update.
    * @param isAddOperation - Indicates whether the operation is to add or remove the assignee.
    * @returns A Promise that resolves to an `AppResponse` object containing the updated ticket IDs.
    */
    async updateMultipleTicketsAssignee(id: number, ticketIds: number[], logInUserId: number, actionType: ActivityLogActionType, socketEvent: SocketEventEnum, isAddOperation: boolean): Promise<AppResponse> {
        try {
            // check assignee user exists
            const query = User.createQueryBuilder("user")
                .select(["user.firstName", "user.lastName"])
                .where("user.id = :id", { id })
            if (isAddOperation) {
                query.andWhere("user.isDeleted = false AND user.isActive = true")
            }
            const assignee = await query.getOne();
            if (!assignee) {
                throw new NotFoundException(`ERR_USER_NOT_FOUND&&&id`)
            }

            const tickets = await this.ticketsRepository.getTicketAssigneeData(ticketIds, id, isAddOperation);
            if (!tickets.length) {
                return {
                    message: "SUC_DATA_UP_TO_DATE",
                    data: tickets
                };
            }

            //db update
            if (isAddOperation) {
                // Add assignee
                const mappedData = tickets.map(ticketId => ({
                    userId: id, ticketId, createdBy: logInUserId
                }));
                await this.ticketsRepository.addAssignee(mappedData);
            } else {
                // Remove assignee
                await this.ticketsRepository.removeAssignee(`ticket_id IN (${tickets})`, id);
            }

            // activity log flow
            const logCommonData = {
                userId: logInUserId,
                formType: null,
                fieldName: 'assignee',
                actionType,
                ...(isAddOperation ? { newData: id } : { oldData: id })
            }
            const activityData = tickets.map(ticketId => ({
                ...logCommonData, ticketId
            }))
            if (activityData.length) {
                this.activityLogService.addActivityLog(activityData, [], socketEvent, true);
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAddedMultiple(ticketIds, logInUserId);

            const messages = require('./../../i18n/en/success.json'); // Load the JSON file
            const resMessage = isAddOperation
                ? messages['SUC_TICKET_ASSIGNEE_ADDED_SUCCESSFULLY']
                : messages['SUC_TICKET_ASSIGNEE_REMOVED_SUCCESSFULLY'];
            const assigneeName = `${assignee.firstName} ${assignee.lastName}.`;

            return {
                message: `${resMessage} ${assigneeName}`,
                data: tickets
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Bulk update the tags associated with multiple tickets.
     *
     * @param id - The ID of the tag to update the tickets with.
     * @param ticketIds - An array of ticket IDs to update.
     * @param logInUserId - The ID of the user performing the update.
     * @param actionType - The type of action being performed (add or remove).
     * @param socketEvent - The socket event to emit after the update.
     * @param isAddOperation - Indicates whether the operation is to add or remove the tag.
     * @returns A Promise that resolves to an `AppResponse` object containing the updated ticket IDs.
     */
    async updateMultipleTicketsTag(id: number, ticketIds: number[], logInUserId: number, actionType: ActivityLogActionType, socketEvent: SocketEventEnum, isAddOperation: boolean): Promise<AppResponse> {
        try {
            // check assignee user exists
            const query = Tags.createQueryBuilder("tag")
                .select(["tag.name"])
                .where("tag.id = :id", { id })
            if (isAddOperation) {
                query.andWhere("tag.isDeleted = false AND tag.isActive = true")
            }
            const tag = await query.getOne();
            if (!tag) {
                throw new NotFoundException(`ERR_TAG_NOT_FOUND&&&id&&&ERROR_MESSAGE`)
            }

            const tickets = await this.ticketsRepository.getTicketTagData(ticketIds, id, isAddOperation);
            if (!tickets.length) {
                return {
                    message: "SUC_DATA_UP_TO_DATE",
                    data: tickets
                };
            }

            //db update
            if (isAddOperation) {
                // Add tag
                const mappedData = tickets.map(ticketId => ({
                    ticketId, tagId: id, createdBy: logInUserId
                }));
                await this.ticketsRepository.mapTicketTag(mappedData);
            } else {
                // Remove tag
                await this.ticketsRepository.deleteTicketTag(id, null, tickets);
            }

            // activity log flow
            const logCommonData = {
                userId: logInUserId,
                formType: null,
                fieldName: 'flag',
                actionType,
                ...(isAddOperation ? { newData: tag.name } : { oldData: tag.name })
            }
            const activityData = tickets.map(ticketId => ({
                ...logCommonData, ticketId
            }))
            this.activityLogService.addActivityLog(activityData, [], socketEvent, true);

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAddedMultiple(ticketIds, logInUserId);

            return {
                message: isAddOperation ? 'SUC_TAG_ASSIGNED' : 'SUC_TICKET_TAG_REMOVED',
                data: tickets
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     *Bulk update Priority: Updates the priority of multiple tickets.
     *
     * @param id - The ID of the priority to update the tickets to.
     * @param ticketIds - An array of ticket IDs to update.
     * @param userId - The ID of the user performing the update.
     * @param type - The type of update being performed.
     * @returns A Promise that resolves to an `AppResponse` object containing the updated ticket IDs and the new priority value.
     */
    async updateMultipleTicketsPriority(id: number, ticketIds: number[], userId: number, type: UpdateDataFieldTypesEnum,): Promise<AppResponse> {
        try {
            let newValue = null;

            if (id !== null) {
                //check priority
                const { name, colorCode } = await checkPriorityExists(id);
                newValue = { value: name, color: colorCode };
            }

            //find type specific tickets
            const tickets: Tickets[] = await this.ticketsRepository.getTicketDetailsByType(ticketIds, type, id);
            if (!tickets.length) {
                return {
                    message: "SUC_DATA_UP_TO_DATE",
                    data: {
                        ticketIds: [],
                        value: newValue
                    }
                };
            }

            //create activity logs data
            const { activityData } = await this.ticketsRepository.multipleUpdateActivityLog(
                type, tickets, userId, newValue)

            //update data in db
            ticketIds = tickets.map(e => e.id)
            await this.ticketsRepository.updateTicketsDetail({ type, id }, userId, ticketIds);

            //add activity logs in db
            this.activityLogService.addActivityLog(activityData, [], SocketEventEnum.TICKET_DATA_UPDATE, true);

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAddedMultiple(ticketIds, userId);

            //analytics count socket event
            await this.ticketAnalyticsSocketEvent([userId]);

            return {
                message: "SUC_TICKET_UPDATED",
                data: {
                    ticketIds,
                    value: newValue
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Bulk update status : Updates the status of multiple tickets.
     *
     * @param statusId - The ID of the ticket status to update the tickets to.
     * @param ticketIds - An array of ticket IDs to update.
     * @param userId - The ID of the user performing the update.
     * @param type - The type of update being performed.
     * @returns A Promise that resolves to an `AppResponse` object containing the updated ticket IDs and the new status name.
     */
    async updateMultipleTicketsStatus(statusId: number, ticketIds: number[], userId: number, type: UpdateDataFieldTypesEnum): Promise<AppResponse> {
        try {
            if (statusId === null) {
                throw new BadRequestException(`ERR_TICKET_STATUS_REQUIRED&&&id&&&ERROR_MESSAGE`);
            }
            // check status exists
            const { internalStatusName } = await checkTicketStatusExists(statusId, true);

            //find type specific tickets
            const tickets: Tickets[] = await this.ticketsRepository.getTicketDetailsByType(ticketIds, type, statusId);
            if (!tickets.length) {
                return {
                    message: "SUC_DATA_UP_TO_DATE",
                    data: {
                        ticketIds: [],
                        value: internalStatusName
                    }
                };
            }

            //create activity logs data
            const { activityData } = await this.ticketsRepository.multipleUpdateActivityLog(
                type, tickets, userId, internalStatusName)

            //update data in db
            ticketIds = tickets.map(e => e.id)
            await this.ticketsRepository.updateTicketsDetail({ type, id: statusId }, userId, ticketIds);

            //add activity logs in db
            this.activityLogService.addActivityLog(activityData, [], SocketEventEnum.TICKET_DATA_UPDATE, true);

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAddedMultiple(ticketIds, userId);

            //analytics count socket event
            await this.ticketAnalyticsSocketEvent([userId]);

            return {
                message: "SUC_TICKET_UPDATED",
                data: {
                    ticketIds,
                    value: internalStatusName
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Bulk update team : Updates the team assigned to multiple tickets.
     *
     * @param teamId - The ID of the team to assign the tickets to.
     * @param ticketIds - An array of ticket IDs to update.
     * @param userId - The ID of the user performing the update.
     * @param type - The type of update being performed.
     * @returns A Promise that resolves to an `AppResponse` object containing the updated ticket IDs and the team name.
     */
    async updateMultipleTicketTeam(teamId: number, ticketIds: number[], userId: number, type: UpdateDataFieldTypesEnum): Promise<AppResponse> {
        try {
            let teamName: string;
            // check team exists
            if (teamId) {
                const { name } = await checkTicketTeamExists(teamId, true);
                teamName = name;
            }

            //find type specific tickets
            const tickets: Tickets[] = await this.ticketsRepository.getTicketDetailsByType(ticketIds, type, teamId);
            if (!tickets.length) {
                return {
                    message: "SUC_DATA_UP_TO_DATE",
                    data: {
                        ticketIds: [],
                        value: teamName
                    }
                };
            }

            //create activity logs data
            const { activityData } = await this.ticketsRepository.multipleUpdateActivityLog(
                type, tickets, userId, teamName)

            //update data in db
            ticketIds = tickets.map(e => e.id)
            await this.ticketsRepository.updateTicketsDetail({ type, id: teamId }, userId, ticketIds);

            //add activity logs in db
            this.activityLogService.addActivityLog(activityData, [], SocketEventEnum.TICKET_DATA_UPDATE, true);

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAddedMultiple(ticketIds, userId);

            return {
                message: "SUC_TICKET_UPDATED",
                data: {
                    ticketIds,
                    value: teamName
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Retrieves the count of missing/null ticket's fields for a given ticket.
     *
     * @param ticketId - The ID of the ticket to check for missing data.
     * @returns A Promise that resolves to an object containing the count of null values, the ticket status slug, and the null fields.
     */
    async getMissingTicketDataCount(ticketId: number) {
        try {
            const ticket = await this.ticketsRepository.createQueryBuilder("ticket")
                .leftJoinAndSelect('ticket.ticketStatus', 'ticketStatus')
                .leftJoinAndSelect('ticket.carrierType', 'carrierType')
                .where(`ticket.id = :ticketId`, { ticketId })
                .select([
                    "ticket.trackingId", "ticket.customerId", "ticket.ticketStatusId", "ticket.carrierTypesId", "ticket.assignedToDeptId", "ticket.tidTypeId", "ticketStatus.slug",
                    "carrierType.name"
                ])
                .getOne();

            if (ticket) {
                const { ticketStatus, carrierType, ...ticketFields } = ticket;
                if (carrierType?.name.toLowerCase() === 'email') {
                    delete ticketFields.trackingId;
                }

                if (ticketFields?.trackingId === '') {
                    ticketFields.trackingId = null;
                }
                const nullFieldCount = await checkTicketNullValues(ticketFields, ticketStatus?.slug)

                // channel = ticketId, event = "missing_ticket_details", data = {count of null values, status slug & null fields}
                this.socketGateway.notify(ticketId, SocketEventEnum.MISSING_TICKET_DETAILS, nullFieldCount);
            }
        } catch (error) {
            throwException(error);
        }
    }

    /**
    * Emits a ticket analytics event to all connected clients via the socket service.
    */
    async ticketAnalyticsSocketEvent(users?: number[]) {
        const { data } = await this.getTicketAnalytics();

        const userData = users || await getAllUserIds();
        if (userData.length) {
            this.socketGateway.notify(users, SocketEventEnum.TICKET_ANALYTICS_EVENT, data);
        }
    }

    async finishTicket(dto, user): Promise<AppResponse> {
        try {
            await this.ticketsRepository.finishTicket(dto, user);
            return {
                message: "SUC_TICKET_STATUS_UPDATED"
            };
        } catch (error) {
            throwException(error)
        }
    }

    async generateReturnLabel(ticketId, user): Promise<AppResponse> {
        try {
            const ticket = await checkTicketExists(ticketId);
            const fedExDoc = await FedExDocuments.findOne({ where: { ticketId, isReturnLabel: true, isDeleted: false } });
            if (fedExDoc) {
                fedExDoc.isDeleted = true;
                await fedExDoc.save();
            }
            const pdfResponse = await this.ticketsRepository.generateReturnLabel();
            await this.uploadLabels(pdfResponse, ticket, user);
            return {
                message: "SUC_GENERATE_RETURN_LABEL"
            };
        } catch (error) {
            throwException(error)
        }
    }

    /**
     * Adds an activity to a ticket, such as a comment, billing note, or runner note.
     * 
     * @param dto - An object containing the details of the activity to be added, including the ticket ID, activity type, and data.
     * @param userId - The ID of the user performing the activity.
     * @returns A Promise that resolves to an `AppResponse` object containing a success message.
     * @throws `BadRequestException` if the length of a runner note exceeds the maximum allowed length.
     * @throws Any other exceptions that may occur during the operation.
     */
    async addActivity(dto: AddActivityDto, userId: number): Promise<AppResponse> {
        try {
            if (dto?.type === ActivityTypesEnum.RUNNER_NOTE && dto?.data.length > 300) {
                throw new BadRequestException("ERR_RUNNER_NOTE_MAX_LENGTH&&&data");
            }

            await findTicket(dto.ticketId);

            const socketData: any = {};
            let dtoData: any = {};

            switch (dto.type) {
                case ActivityTypesEnum.COMMENT:
                    dtoData = {
                        userId: userId,
                        ticketId: dto.ticketId,
                        comment: dto.data,
                        mentions: dto?.mentions
                    }
                    await this.activityLogService.addComment(dtoData);
                    break;

                case ActivityTypesEnum.BILLING_NOTE:
                    socketData.billingNote = dto.data;
                    dtoData = {
                        ticketId: dto.ticketId,
                        billingNote: dto.data,
                    }
                    await this.billingInfoRepository.setBillingNote(dtoData, userId, false);
                    break;

                case ActivityTypesEnum.RUNNER_NOTE:
                    socketData.runnerNote = dto.data;
                    dtoData = {
                        ticketId: dto.ticketId,
                        runnerNote: dto.data,
                    }
                    await this.billingInfoRepository.setBillingNote(dtoData, userId, false);
                    break;
            }

            if ([ActivityTypesEnum.RUNNER_NOTE, ActivityTypesEnum.BILLING_NOTE].includes(dto.type)) {
                const { notes } = await this.activityLogRepository.getCommentsAndNotes(dto.ticketId, true);
                this.socketGateway.notify(dto.ticketId, SocketEventEnum.ACTIVITY_UPDATE, notes);
            }

            return {
                message: "SUC_ACTIVITY_CREATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getFuzzyTicketList(query: GlobalSearchPageQueryDto, userId: number): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getFuzzyTicketList(query, userId);
            return {
                message: "SUC_TICKET_LIST_FETCHED", data
            };
        } catch (error) {
            throwException(error);
        }
    }
    
    /**
     * Retrieves the history of a ticket.
     *
     * @param ticketId - The ID of the ticket to retrieve the history for.
     * @returns An `AppResponse` object containing the activity logs for the specified ticket.
     */
    async getHistory(ticketId: number): Promise<AppResponse> {
        try {
            const data = await this.ticketsRepository.getHistory(ticketId);
            return {
                message: "SUC_ACTIVITY_LOGS_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
}



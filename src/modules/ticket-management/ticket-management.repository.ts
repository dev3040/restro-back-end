import moment from 'moment';
import { Tickets } from '../../shared/entity/tickets.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { TicketAssignedUsers } from 'src/shared/entity/ticket-assigned-users.entity';
import { Tags } from 'src/shared/entity/tags.entity';
import { SetAssigneeDto } from './dto/set-assignee.dto';
import { checkAssignedUsersForTicket, checkCarrierTypeExists, checkCustomerExists, checkDepartmentExists, checkMultipleTicketAssigneeExists, checkPriorityExists, checkTagExists, checkTagsExist, checkTicketAssigneeExists, checkTicketExists, checkTicketStatusExists, checkTicketTagExists, checkTidTypeExists, checkValidDateReceived, commonDeleteHandler, convertToNumberIfNumeric, fedExShipmentJson, findTicket, generateInvoiceId } from 'src/shared/utility/common-function.methods';
import { TicketTags } from 'src/shared/entity/ticket-tags.entity';
import { errorMessage } from 'src/config/common.config';
import { VinInfo } from 'src/shared/entity/vin-info.entity';
import { AddTicketTagDto } from './dto/add-ticket-tag.dto';
import { UpdateDataFieldTypesEnum } from 'src/shared/enums/general-dto-fields.enum';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { DataEntryFormType, FormType } from 'src/shared/enums/form-type.enum';
import { TicketOrderByEnum } from 'src/shared/enums/ticket-order-by.enum';
import { OrderDir } from 'src/shared/enums/order-dir.enum';
import { TaskGroupByEnum } from 'src/shared/enums/task-group-by.enum';
import { TicketDocuments } from 'src/shared/entity/ticket-documents.entity';
import { VinMaster } from 'src/shared/entity/vin-master.entity';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import { GeneralConst, SlugConstants } from 'src/shared/constants/common.constant';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { TicketStatuses } from 'src/shared/entity/ticket-statuses.entity';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { FedExConfig } from 'src/shared/entity/fedex-config.entity';
import { SocketGateway } from '../socket/socket.gateway';
import { GlobalSearchPageQueryDto } from './dto/list-query.dto';


@Injectable()
export class TicketsRepository extends Repository<Tickets> {

    constructor(
        readonly dataSource: DataSource,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => ActivityLogsService))
        private readonly activityLogService: ActivityLogsService,
        private socketGateway: SocketGateway
    ) {
        super(Tickets, dataSource.createEntityManager());
    }
    private cachedToken: { token: string, expiresAt: number } = null;

    async addTicket(addTickets, userId: number): Promise<Tickets> {
        try {
            let finalTagsArr = [];
            let tArr = []
            let assignedUsersArr = [];
            let vinId: number;

            //check is hideDefaultError provided
            const hideErrVal = Boolean(addTickets.hideDefaultError) === true ? addTickets.hideDefaultError === 'true' : false

            // Validation
            if (addTickets?.docReceivedDate) await checkValidDateReceived(addTickets.docReceivedDate);
            if (addTickets?.customerId) await checkCustomerExists(addTickets.customerId);
            if (addTickets?.carrierTypesId) await checkCarrierTypeExists(addTickets.carrierTypesId);
            if (addTickets?.tidTypeId) await checkTidTypeExists(addTickets.tidTypeId);
            if (addTickets?.priorityId) await checkPriorityExists(addTickets.priorityId);
            if (addTickets?.assignedToDeptId) await checkDepartmentExists(addTickets.assignedToDeptId);

            //Handle status
            if (addTickets?.ticketStatusId) {
                const ticketStatus = await checkTicketStatusExists(addTickets.ticketStatusId, true);
                if (ticketStatus.slug === SlugConstants.ticketStatusSentToDmv) {
                    addTickets.sentToDmvAt = new Date();
                    addTickets.sentToDmvBy = userId
                }
            } else if (addTickets?.statusSlug === SlugConstants.ticketStatusQuote) {
                const quoteStatus = await TicketStatuses.findOne({
                    select: ['id'],
                    where: { slug: SlugConstants.ticketStatusQuote }
                })
                if (!quoteStatus) {
                    throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND&&&statusSlug&&&ERROR_MESSAGE`)
                }
                addTickets.ticketStatusId = quoteStatus.id;
            }

            // Handle assigned users
            if (addTickets?.assignedUsers) {
                assignedUsersArr = [...new Set(addTickets.assignedUsers.split(',').map(Number))];
                if (assignedUsersArr.length) await checkAssignedUsersForTicket(assignedUsersArr);
            }

            // Handle tags
            if (addTickets?.tagIds) {
                tArr = addTickets.tagIds.split(',').map(e => +e)
                if (tArr?.length) await checkTagsExist(tArr)
            }

            // check if vin already exists, if not then create a entry in master table 
            const vinInfo = addTickets?.vinInfo;

            // Check if VIN exists in master, else create a new one
            const vinDetails = await this.checkVinData(vinInfo.vinNumber);
            const newVin = vinDetails
                ? await this.createVinInfo(vinDetails, vinDetails.id, null, hideErrVal)
                : await this.createVinInfo(vinInfo, null, addTickets.vinError, hideErrVal);
            vinId = newVin.id;

            // Generate Invoice ID based on ticket count
            const ticketCount = await this.getTicketCount();
            const invoiceId = await generateInvoiceId(ticketCount);

            delete addTickets.vinInfo
            const ticketData = this.create({
                ...addTickets,
                vinId,
                invoiceId,
                createdBy: userId,
                sentToDmvAt: addTickets.sentToDmvAt,
                sentToDmvBy: addTickets.sentToDmvBy
            });
            const newTicket: any = await this.save(ticketData);

            // Handle ticket assigned users
            if (assignedUsersArr?.length) {
                try {
                    const ticketAssignedUsersBulk = assignedUsersArr.map(userId => ({
                        ticketId: newTicket.id,
                        userId,
                        createdBy: userId
                    }));
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(TicketAssignedUsers)
                        .values(ticketAssignedUsersBulk)
                        .execute();
                } catch (err) {
                    throw new BadRequestException(`${err}&&&assignedUsers&&&ERROR_MESSAGE`)
                }
            }

            //tags master
            if (addTickets?.tags) {
                try {
                    const tagData = addTickets?.tags.split(',').map(tag => ({
                        name: tag,
                        isActive: true,
                        createdBy: userId
                    }));
                    const createdTags = await this.manager.createQueryBuilder()
                        .insert()
                        .into(Tags)
                        .values(tagData)
                        .execute();

                    const addedTags = createdTags?.generatedMaps.map(e => e.id)
                    finalTagsArr = finalTagsArr.concat(addedTags)
                } catch (err) {
                    throw new BadRequestException(`${err}&&&tags&&&ERROR_MESSAGE`)
                }
            }

            //add existing tags to ticket
            finalTagsArr.push(...tArr);

            //ticket-tags mapping
            if (finalTagsArr.length) {
                try {
                    const ticketTagsBulk = finalTagsArr.map(e => ({
                        ticketId: newTicket.id,
                        tagId: +e,
                        createdBy: userId
                    }));
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(TicketTags)
                        .values(ticketTagsBulk)
                        .execute();
                } catch (err) {
                    throw new BadRequestException(`${err}&&&finalTagsArr&&&ERROR_MESSAGE`)
                }
            }
            return newTicket;

        } catch (error) {
            throwException(error);
        }
    }

    async createVinInfo(addVinInfo/* : VinInfoDto */, vinMasterId?: number, vinError?, hideDefaultError?): Promise<VinInfo> {
        try {
            return await this.manager.transaction(async transactionalEntityManager => {
                if (vinMasterId) {
                    const dto: any = addVinInfo;
                    delete dto.error;
                    delete dto.id;

                    const vinInfo = transactionalEntityManager.create(VinInfo, { ...dto, vinMasterId, hideDefaultError });
                    await transactionalEntityManager.save(vinInfo);
                    return vinInfo;

                } else {
                    let vinErrorData: any = null;

                    // Check vinError, Parse it to match the VinErrorsInterface if not already  
                    if (vinError !== undefined && vinError !== 'null') {
                        if (typeof vinError === 'string') {
                            vinErrorData = JSON.stringify(JSON.parse(vinError))
                        } else if (typeof vinError === 'object') {
                            vinErrorData = vinError
                        }
                    }

                    const vinMaster = transactionalEntityManager.create(VinMaster, { ...addVinInfo, error: vinErrorData });
                    const master = await transactionalEntityManager.save(vinMaster);

                    const vinInfo = transactionalEntityManager.create(VinInfo, { ...addVinInfo, vinMasterId: master.id, hideDefaultError });
                    await transactionalEntityManager.save(vinInfo);
                    return vinInfo;
                }

            });
        } catch (error) {
            throwException(error);
        }
    }

    async updateTicketData(data, ticketId: number) {
        try {
            await this.manager.createQueryBuilder(Tickets, 'tickets')
                .update()
                .set(data)
                .where('(id = :ticketId )', { ticketId })
                .execute();
        } catch (error) {
            throw new BadRequestException(`ERR_UPDATING_DATA&&&updateTicketData&&&ERROR_MESSAGE`)
        }
    }

    async getTicketDetails(id, isBillingDoc = false): Promise<Tickets> {
        try {
            const ticket: any = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                .leftJoinAndSelect("ticket.ticketAssignedUser", "ticketAssignedUser")
                .leftJoinAndSelect("ticket.department", "department")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("ticket.priority", "priority")
                .leftJoinAndSelect("ticket.customer", "customer")
                .leftJoinAndSelect("ticket.carrierType", "carrierType")
                .leftJoinAndSelect("ticket.ticketTag", "ticketTag")
                .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", `ticketDocuments.isDeleted = false ${isBillingDoc ? 'and ticketDocuments.isBillingDocDelete = false' : 'and ticketDocuments.isBillingDoc = false'}`)
                .leftJoinAndSelect("ticket.fedExDocuments", "fedExDocuments", "fedExDocuments.isDeleted = false")
                .leftJoinAndSelect("ticketTag.tag", "tag")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("vinInfo.vinMaster", "vinMaster")
                .leftJoinAndSelect("ticket.tidTypeData", "tidTypeData")
                .leftJoinAndSelect("ticketAssignedUser.assignedUser", "assignedUser", "assignedUser.isDeleted = false")
                .select(["ticket",
                    "ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.slug",
                    "ticketAssignedUser.userId",
                    "department.id", "department.name",
                    "priority.id", "priority.name", "priority.colorCode",
                    "basicInfo.transactionTypeId", "basicInfo.customerTransactionType",
                    "transactionType.id", "transactionType.name", "transactionType.transactionCode",
                    "carrierType.id", "carrierType.name",
                    "customer.id", "customer.name",
                    "ticketTag.id", "ticketTag.ticketId", "ticketTag.tagId",
                    "tag.id", "tag.name",
                    "assignedUser.id", "assignedUser.firstName", "assignedUser.lastName",
                    "ticketDocuments",
                    "fedExDocuments.id", "fedExDocuments.fileName", "fedExDocuments.trackingNumber",
                    "vinInfo.id", "vinInfo.vinNumber", "vinInfo.hideDefaultError",
                    "tidTypeData.id", "tidTypeData.name",
                    "vinMaster.error"])
                .where(`(ticket.id = :id AND ticket.isDeleted = false)`, { id })
                .orderBy('ticketDocuments.id', 'ASC')
                .addOrderBy('ticketAssignedUser.id', 'ASC')
                .getOne();

            if (!ticket) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&id`)
            }

            return ticket;
        } catch (error) {
            throwException(error);
        }
    }

    async getFormsDetail(id) {
        try {
            const ticket: any = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.customer", "ticketCustomer")
                .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", "ticketDocuments.isDeleted = false and ticketDocuments.isSigned = false and ticketDocuments.isBillingDoc = false")
                .leftJoinAndSelect("ticket.fedExDocuments", "fedExDocuments", "fedExDocuments.isDeleted = false")
                .leftJoinAndSelect("ticket.fmvMasters", "fmvMasters", "fmvMasters.isDeleted = false and fmvMasters.vinId=ticket.vinId")
                .leftJoinAndSelect("fmvMasters.document", "document", "document.isDeleted = false")
                .leftJoinAndSelect("vinInfo.primaryColor", "primaryColor")
                .leftJoinAndSelect("vinInfo.secondaryColor", "secondaryColor")
                .leftJoinAndSelect("vinInfo.vinMaster", "vinMaster")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("ticket.titleInfo", "titleInfo")
                .leftJoinAndSelect("ticket.insuranceInfo", "insuranceInfo")
                .leftJoinAndSelect("ticket.lienInfo", "lienInfo", "lienInfo.isDeleted = false")
                .leftJoinAndSelect("lienInfo.lien", "lien")
                .leftJoinAndSelect("titleInfo.titleState", "titleState")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .leftJoinAndSelect("basicInfo.customerContacts", "customerContacts")
                .leftJoinAndSelect("ticket.registrationInfo", "regInfo")
                .leftJoinAndSelect("regInfo.plate", "plate")
                .leftJoinAndSelect("ticket.tradeInInfo", "tradeInInfo", "tradeInInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect(
                    "county.countyProcessing",
                    "countyProcessing",
                    `
                      "countyProcessing"."city_id" IN (
                        SELECT cm.id
                        FROM "county"."county_milage" AS cm
                        WHERE cm.district_name ILIKE "buyerInfo"."district"
                      )
                      OR "countyProcessing"."city_id" IS NULL
                    `
                )
                .leftJoinAndSelect("county.countyCheatSheet", "countyCheatSheet")
                .leftJoinAndSelect("buyerInfo.secCounty", "secCounty")
                .leftJoinAndSelect("ticket.billingInfo", "billingInfo")
                .leftJoinAndSelect("ticket.billingInfoDeposits", "billingInfoDeposits")
                .select([
                    "ticket.startDate", "ticket.id", "ticket.invoiceId", "ticket.isStateTransfer", "ticket.purchaseDate", "ticketCustomer.id", "ticketCustomer.name", "ticketCustomer.isDeleted", "ticketCustomer.billingNote",
                    "ticket.processingType",
                    "vinInfo.id", "vinInfo.vinNumber", "vinInfo.year", "vinInfo.model", "vinInfo.productClass", "vinInfo.bodyStyle", "vinInfo.gvwr", "vinInfo.gvw",
                    "vinInfo.primaryColorId", "vinInfo.secondaryColorId", "vinInfo.cylinders", "vinInfo.primaryFuelType", "vinInfo.secondaryFuelType",
                    "vinInfo.engineType", "vinInfo.make", "vinInfo.noOfDoors", "vinInfo.shippingWeight", "vinInfo.vehicleUse", "vinInfo.shippingInfo", "vinInfo.type", "vinInfo.emissions", "vinInfo.hideDefaultError",
                    "primaryColor", "secondaryColor", "fmvMasters.id", "fmvMasters.vinId", "fmvMasters.vinFirstHalf", "fmvMasters.year", "fmvMasters.price", "fmvMasters.valueType",
                    "fmvMasters.isMaster", "fmvMasters.source", "fmvMasters.series", "fmvMasters.dateEntered", "fmvMasters.effectiveYear", "document.id", "document.fileName",
                    "basicInfo.id", "basicInfo.client", "basicInfo.unit", "basicInfo.transactionTypeId", "basicInfo.ticketId", "basicInfo.customerContactInfoId",
                    "basicInfo.customerId", "basicInfo.customerTransactionType", "basicInfo.isTitle", "basicInfo.isRegistration", "basicInfo.isIrp", "basicInfo.isConditionalTitle",
                    "titleInfo.id", "titleInfo.ticketId", "titleInfo.stateId", "titleInfo.currentTitle", "titleInfo.isNew", "titleInfo.brands", "titleInfo.odometerCode",
                    "titleInfo.odometerReading", "titleInfo.odometerUnit", "titleInfo.odometerDate",
                    "titleState.id", "titleState.name", "titleState.code", "titleState.fieldName", "titleState.location", "titleState.titleFormat",
                    "lienInfo.id", "lienInfo.ticketId", "lienInfo.lienId", "lienInfo.idOption", "lienInfo.licenseNumber", "lienInfo.firstName",
                    "lienInfo.middleName", "lienInfo.lastName", "lienInfo.suffix", "lienInfo.isElt", "lienInfo.isIndividual", "lienInfo.address", "lienInfo.isLienChecked", "lienInfo.holderName",
                    "lien.id", "lien.address", "lien.lienHolderId", "lien.holderName", "lien.isActive", "lien.isDeleted",
                    'insuranceInfo.id', 'insuranceInfo.ticketId', 'insuranceInfo.companyName', 'insuranceInfo.effectiveDate', 'insuranceInfo.expirationDate', 'insuranceInfo.policyNumber', 'insuranceInfo.type',
                    "transactionType.id", "transactionType.name", "transactionType.isDeleted",
                    "customer.id", "customer.name", "customer.isDeleted", "customerContacts.id", "customerContacts.name", "customerContacts.role", "customerContacts.isDeleted",
                    "ticketDocuments.id", "ticketDocuments.fileName", "ticketDocuments.description", "ticketDocuments.isSigned",
                    "fedExDocuments.id", "fedExDocuments.fileName", "fedExDocuments.trackingNumber",
                    "tradeInInfo.id", "tradeInInfo.odometerCode", "tradeInInfo.lastOdometerReading", "tradeInInfo.tradeInAllowance", "tradeInInfo.vinNumber",
                    "sellerInfo.id", "sellerInfo.sellerId", "sellerInfo.name", "sellerInfo.sellerType", "sellerInfo.dealerId", "sellerInfo.isDealership",
                    "sellerInfo.ticketId", "sellerInfo.salesTaxId", "sellerInfo.address",
                    "buyerInfo.id", "buyerInfo.type", "buyerInfo.name", "buyerInfo.secondaryType", "buyerInfo.secondaryName", "buyerInfo.address", "buyerInfo.mailingAddress", "buyerInfo.email", "buyerInfo.phone", "buyerInfo.secondaryEmail", "buyerInfo.secondaryPhone", "buyerInfo.firstName",
                    "buyerInfo.middleName", "buyerInfo.lastName", "buyerInfo.suffix", "buyerInfo.dob", "buyerInfo.ticketId", "buyerInfo.idOption", "buyerInfo.license", "buyerInfo.expireDate", "buyerInfo.isActive", "buyerInfo.isLessee",
                    "buyerInfo.isLessor", "buyerInfo.isMilitary", "buyerInfo.taxExempt", "buyerInfo.isSecondary", "buyerInfo.activeDutyMilitaryStationedInGa", "buyerInfo.secActiveDutyMilitaryStationedInGa", "buyerInfo.secondaryTaxExempt",
                    "buyerInfo.secFirstName", "buyerInfo.secMiddleName", "buyerInfo.secLastName", "buyerInfo.secSuffix", "buyerInfo.secDob", "buyerInfo.secIdOption", "buyerInfo.secLicense", "buyerInfo.secExpireDate",
                    "buyerInfo.secIsMilitary", "buyerInfo.secAddress", "buyerInfo.secMailingAddress", "buyerInfo.isPrimeAddClone", "buyerInfo.isSecAddClone", "buyerInfo.isResidential", "buyerInfo.secIsResidential", "buyerInfo.isOwner", "buyerInfo.purchaseType", "buyerInfo.secPurchaseType", "buyerInfo.district", "buyerInfo.secDistrict", "county.id", "county.name", "secCounty.id", "secCounty.name", "buyerInfo.isPrimary",
                    "countyCheatSheet.emission", "regInfo.id", "regInfo.ticketId", "regInfo.plateTypeId", "regInfo.plateTransfer", "regInfo.plateNumber", "regInfo.expirationDate", "regInfo.gvw", "regInfo.veteranExempt", "regInfo.initialTotalCost", "regInfo.emissionVerified", "regInfo.isRenewTwoYears", "regInfo.isHighwayImpact50",
                    "countyProcessing.type",
                    "ticketCustomer.id", "ticketCustomer.name", "regInfo.isHighwayImpact100",
                    "regInfo.isAlternativeFuelFee", "regInfo.isRenewTwoYearsRegExp", "regInfo.isForHire", "regInfo.costCalc", "regInfo.line2209", "regInfo.mailingAddress", "regInfo.is2290",
                    "regInfo.type", "regInfo.primaryFuelType", "regInfo.secondaryFuelType",
                    "plate.id", "plate.plateDetails", "plate.categoryCode", "plate.isTransferable", "plate.standardFee",
                    "billingInfo.id", "billingInfo.ticketId", "billingInfo.expressMailFees", "billingInfo.address", "billingInfo.isDifferentAddress",
                    "billingInfo.transactionReturnType", "billingInfo.trackingLabel", "billingInfo.billingNote", "billingInfo.runnerNote", "billingInfoDeposits.id", "billingInfoDeposits.ticketId", "billingInfoDeposits.chequeNumber", "billingInfoDeposits.amount", "billingInfoDeposits.type", "billingInfoDeposits.receivedDate",
                    "vinMaster.error"
                ])
                .where(`(ticket.id = :id AND ticket.isDeleted = false)`, { id })
                .orderBy('ticketDocuments.id', 'ASC')
                .addOrderBy('billingInfoDeposits.id', 'ASC')
                .addOrderBy('fmvMasters.year', 'DESC')
                .addOrderBy("fmvMasters.isMaster", "DESC")
                .addOrderBy("fmvMasters.id", "DESC")
                .getOne();
            if (!ticket) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&id`)
            }

            let tradeInInfo = [];
            let lienInfo = [];
            tradeInInfo = ticket.tradeInInfo.sort((a, b) => a.id - b.id);
            lienInfo = ticket.lienInfo.sort((a, b) => a.id - b.id);

            const lessees = [];
            const lessors = [];
            const owner = [];

            if (ticket && Array.isArray(ticket.buyerInfo)) {
                ticket.buyerInfo.forEach((seller: any) => {
                    if (seller.isOwner && !seller.isLessee && !seller.isLessor) {
                        owner.push(seller);
                    } else if (seller.isLessee && !seller.isLessor && !seller.isOwner) {
                        lessees.push(seller);
                    } else if (seller.isLessor && !seller.isOwner && !seller.isLessee) {
                        lessors.push(seller)
                    }
                });
            }
            return {
                ...ticket,
                tradeInInfo,
                lienInfo,
                lessees,
                lessors,
                owner
            }
        } catch (error) {
            throwException(error);
        }
    }

    async setAssignee(setAssignee: SetAssigneeDto, logInUserId: number): Promise<boolean> {
        try {
            const { ticketId, userId } = setAssignee;
            let isAdded: boolean;

            const checkAssigneeExist = await checkTicketAssigneeExists(ticketId, userId);
            if (!checkAssigneeExist) {
                //create new entry: add
                await this.addAssignee({ ticketId: ticketId, userId: userId, createdBy: logInUserId })
                isAdded = true;
            } else {
                //remove assignee
                await this.removeAssignee(`ticket_id = ${ticketId}`, userId)
                isAdded = false
            }

            return isAdded;
        } catch (error) {
            throwException(error);
        }
    }

    async addAssignee(data) {
        try {
            await this.manager.createQueryBuilder()
                .insert()
                .into(TicketAssignedUsers)
                .values(data)
                .execute();
        } catch (error) {
            throw new BadRequestException(`ERR_STORING_DATA&&&addAssignee&&&ERROR_MESSAGE`)
        }
    }

    async removeAssignee(whereCondition, userId: number) {
        try {
            await this.manager.createQueryBuilder(TicketAssignedUsers, 'ticketAssignedUsers')
                .delete()
                .where(whereCondition)
                .andWhere("user_id = :userId", { userId })
                .execute();
        } catch (error) {
            throw new BadRequestException(`ERR_DELETING_DATA&&&removeAssignee&&&ERROR_MESSAGE`)
        }
    }

    async fetchAllUsersForTicket(dto): Promise<{ userArr: User[], count: number }> {
        try {
            const { ticketId, search } = dto;

            let query = this.manager.createQueryBuilder(User, "user")
                .leftJoinAndSelect("user.avatarColor", "avatarColor")
                .select(["user.id", "user.firstName", "user.lastName", "user.colorId", "avatarColor"])
                .where(`(user.isActive = true)`)
                .andWhere(`(user.isDeleted = false)`)

            if (search) {
                query.andWhere("(user.firstName ilike :search OR user.lastName ilike :search )",
                    { search: `%${search}%` });
            }
            const [users, count] = await query.getManyAndCount();
            let ticketAssignedUsers = []
            if (ticketId) {
                ticketAssignedUsers = await this.manager.createQueryBuilder(TicketAssignedUsers, "ticketUsers")
                    .select(["ticketUsers.id", "ticketUsers.userId", "ticketUsers.ticketId"])
                    .where(`(ticketUsers.ticketId = :ticketId)`, { ticketId })
                    .getMany();
            }

            let userArr = [];
            for (let element of users) {
                userArr.push({
                    id: element.id,
                    firstName: element.firstName,
                    lastName: element.lastName,
                    isAssigned: ticketAssignedUsers.length ? (ticketAssignedUsers.findIndex(x => x.userId == element.id) !== -1) : false,
                    avatarColor: element.avatarColor
                })
            }
            userArr.sort((a, b) => b.isAssigned - a.isAssigned);
            return { userArr, count }

        } catch (error) {
            throwException(error);
        }
    }

    async getTicketCount() {
        try {
            const today = moment(new Date());
            const firstDayOfMonth = today.clone().startOf('month').format('YYYY-MM-DD');
            const lastDayOfMonth = today.clone().endOf('month').format('YYYY-MM-DD');

            let count = await this.manager.createQueryBuilder(Tickets, "ticket")
                .where(`(CAST("ticket"."created_at" as DATE) >= '${firstDayOfMonth}' AND CAST("ticket"."created_at" as DATE) <= '${lastDayOfMonth}')`)
                .andWhere(`("ticket"."is_deleted" = false )`)
                .getCount();
            return count + 1;

        } catch (error) {
            throw new BadRequestException(`${errorMessage}&&&&&&${error}`);
        }
    }

    async fetchAllTags(dto): Promise<{ tags: Tags[], count: number }> {
        try {
            const { search } = dto;

            let query = this.manager.createQueryBuilder(Tags, "tag")
                .select(["tag.id", "tag.name"])
                .where(`(tag.isActive = true)`)

            if (search) {
                query.andWhere("(tag.name ilike :search)", { search: `%${search}%` });
            }
            const [tags, count] = await query.getManyAndCount();
            return { tags, count }

        } catch (error) {
            throwException(error);
        }
    }

    async deleteTicketTag(tagId: number, ticketId?: number, ticketIds?: number[]) {
        try {
            const query = this.manager
                .createQueryBuilder(TicketTags, 'TicketTag')
                .delete()
                .where("tag_id = :tagId", { tagId })
            if (!ticketIds.length) {
                query.andWhere("ticket_id = :ticketId", { ticketId })
            } else {
                query.andWhere("ticket_id IN (:...ticketIds)", { ticketIds })
            }

            await query.execute();
        } catch (error) {
            throw new BadRequestException(`ERR_DELETING_DATA&&&&&&ERROR_MESSAGE`);
        }
    }

    // Check if vin data exists 
    async checkVinData(vinNumber) {
        try {
            const vinInfoExist = await this.manager.createQueryBuilder(VinMaster, "vinInfo")
                .select([
                    "vinInfo.id", "vinInfo.vinNumber", "vinInfo.year", "vinInfo.model", "vinInfo.productClass", "vinInfo.bodyStyle",
                    "vinInfo.gvwr", "vinInfo.gvw", "vinInfo.primaryColorId", "vinInfo.secondaryColorId",
                    "vinInfo.cylinders", "vinInfo.primaryFuelType", "vinInfo.secondaryFuelType",
                    "vinInfo.engineType", "vinInfo.make", "vinInfo.noOfDoors", "vinInfo.shippingWeight",
                    "vinInfo.vehicleUse", "vinInfo.shippingInfo", "vinInfo.type", "vinInfo.emissions"])
                .where(`(LOWER(vinInfo.vinNumber) = :vin)`, { vin: `${vinNumber.toLowerCase()}` })
                .orderBy('vinInfo.id', 'DESC')
                .getOne();
            if (!vinInfoExist) { return null }
            return vinInfoExist;
        } catch (err) {
            throwException(err);
        }
    }

    // Check if tag name already exists 
    async checkTagNameExists(tag) {
        try {
            const tagsExist = await this.manager.createQueryBuilder(Tags, "tag")
                .select(["tag.id", "tag.name"])
                .where(`(LOWER(tag.name) = :tag)`, { tag: `${tag.toLowerCase()}` })
                .getOne();
            if (!tagsExist) { return null }
            return tagsExist;
        } catch (err) {
            throwException(err);
        }
    }

    async addTicketTag(addTicketTagDto: AddTicketTagDto, userId: number) {
        try {
            const { ticketId, tag, tagId } = addTicketTagDto;
            let newTagName: string;
            let newTagId: number;

            await checkTicketExists(ticketId);

            if ((tag && tagId) || (!tag && !tagId)) {
                throw new BadRequestException(`ERR_VALID_TAG_DATA&&&&&&ERROR_MESSAGE`)
            }

            if (tag) {
                //check if tag name already exists
                const tagNameExist = await this.checkTagNameExists(tag)
                if (tagNameExist) {
                    throw new ConflictException(`ERR_TAG_ALREADY_EXISTS&&&tag`)
                } else {
                    //tag creation in master table
                    const newTag = await this.createNewTag(tag, userId)

                    //mapping of ticket & tag
                    await this.mapTicketTag({ ticketId, tagId: newTag?.id, userId })
                    newTagName = tag;
                    newTagId = newTag?.id;
                }
            } else if (tagId) {
                //check if tag id exists
                const masterTag = await checkTagExists(tagId);
                if (!masterTag) {
                    throw new ConflictException(`ERR_TAG_NOT_FOUND&&&tagId`)
                }
                //check if mapping already exists
                const ticketTagExists = await checkTicketTagExists(tagId, ticketId)
                if (ticketTagExists) {
                    throw new ConflictException(`ERR_TAG_ATTACHED&&&tagId`)
                } else {
                    //mapping of ticket & tag
                    await this.mapTicketTag({ ticketId, tagId, userId })
                    newTagName = masterTag.name;
                }
            }

            //activity log
            const data: ActivityLogPayload = {
                userId,
                actionType: ActivityLogActionType.TICKET_DATA_ADD,
                ticketId,
                fieldName: 'flag',
                newData: newTagName,
                oldData: null,
                formType: null
            }
            return { data, tag: { name: newTagName, id: newTagId } };
        } catch (error) {
            throwException(error);
        }
    }

    async createNewTag(tag: string, userId: number) {
        try {
            const newTag = await this.manager.createQueryBuilder()
                .insert()
                .into(Tags)
                .values({
                    name: tag,
                    createdBy: userId
                })
                .execute();
            return newTag.identifiers[0];
        } catch (err) {
            throw new BadRequestException(`ERR_STORING_DATA&&&finalTagsArr&&&ERROR_MESSAGE`)
        }
    }

    async mapTicketTag(data) {
        try {
            await this.manager.createQueryBuilder()
                .insert()
                .into(TicketTags)
                .values(data)
                .execute();
        } catch (err) {
            throw new BadRequestException(`ERR_STORING_DATA&&&finalTagsArr&&&ERROR_MESSAGE`)
        }
    }

    async fetchAllTicketTags(ticketId: number): Promise<{ tags: TicketTags[], count: number }> {
        try {
            const [tags, count] = await this.manager.createQueryBuilder(TicketTags, "tt")
                .leftJoinAndSelect("tt.tag", "tag")
                .select(["tt.id", "tt.tagId", "tag.name"])
                .where(`(tt.ticketId = :ticketId)`, { ticketId })
                .orderBy('tt.id', 'DESC')
                .getManyAndCount();

            return { tags, count }

        } catch (error) {
            throwException(error);
        }
    }

    async getTicketData(id): Promise<Tickets> {
        try {
            const ticket = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                .leftJoinAndSelect("ticket.department", "department")
                .leftJoinAndSelect("ticket.priority", "priority")
                .leftJoinAndSelect("ticket.customer", "customer")
                .leftJoinAndSelect("ticket.carrierType", "carrierType")
                .leftJoinAndSelect("ticket.tidTypeData", "tidTypeData")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .select(["ticket.id", "ticket.id", "ticket.vinId", "ticket.ticketStatusId", "ticket.assignedToDeptId", "ticket.customerId", "ticket.priorityId", "ticket.carrierTypesId", "ticket.tidTypeId", "ticket.trackingId", "ticket.docReceivedDate", "ticket.purchaseDate", "ticket.startDate", "ticket.endDate", "ticket.isActive",
                    "ticketStatus.id", "ticketStatus.internalStatusName",
                    "department.id", "department.name",
                    "priority.id", "priority.name", "priority.colorCode",
                    "carrierType.id", "carrierType.name",
                    "customer.id", "customer.name",
                    "tidTypeData.name",
                    "vinInfo.id", "vinInfo.vinNumber",])
                .where(`ticket.id = :id AND ticket.isDeleted = false`, { id })
                .getOne();
            if (!ticket) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&id`)
            }

            return ticket;
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketDocs(ticketId: number, query): Promise<TicketDocuments[]> {
        try {
            await findTicket(ticketId);
            const queryBuilder = this.manager.createQueryBuilder(TicketDocuments, "ticketDocuments")
                .select(["ticketDocuments.id", "ticketDocuments.fileName", "ticketDocuments.description", "ticketDocuments.filePath", "ticketDocuments.isSigned"])
                .where("ticketDocuments.ticketId = :ticketId", { ticketId })
                .andWhere("ticketDocuments.isDeleted = false");

            if (query.isSigned !== undefined) {
                queryBuilder.andWhere("ticketDocuments.isSigned = :isSigned", { isSigned: query.isSigned });
            }

            if (query.isBillingDoc !== undefined) {
                queryBuilder.andWhere("ticketDocuments.isBillingDoc = :isBillingDoc", { isBillingDoc: query.isBillingDoc });
            }

            const docs = await queryBuilder
                .orderBy("ticketDocuments.id", "ASC")
                .getMany();

            return docs.length > 0 ? docs : [];
        } catch (error) {
            throwException(error);
        }
    }

    async getForms(forms) {
        try {
            let query: any = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.customer", "ticketCustomer")
                .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", "ticketDocuments.isDeleted = false and ticketDocuments.isSigned = false and ticketDocuments.isBillingDoc = false")
                .leftJoinAndSelect("ticket.fmvMasters", "fmvMasters", "fmvMasters.isDeleted = false and fmvMasters.vinId=ticket.vinId")
                .leftJoinAndSelect("fmvMasters.document", "document", "document.isDeleted = false")
                .leftJoinAndSelect("vinInfo.primaryColor", "primaryColor")
                .leftJoinAndSelect("vinInfo.secondaryColor", "secondaryColor")
                .select([
                    "ticket.startDate", "ticket.id", "ticket.invoiceId", "ticketCustomer.id", "ticketCustomer.name", "ticketCustomer.isDeleted",
                    "vinInfo.id", "vinInfo.vinNumber", "vinInfo.year", "vinInfo.model", "vinInfo.productClass", "vinInfo.bodyStyle", "vinInfo.gvwr", "vinInfo.gvw", "vinInfo.primaryColorId",
                    "vinInfo.secondaryColorId", "vinInfo.cylinders", "vinInfo.primaryFuelType", "vinInfo.secondaryFuelType", "vinInfo.engineType", "vinInfo.make", "vinInfo.noOfDoors", "vinInfo.shippingWeight", "vinInfo.vehicleUse", "vinInfo.shippingInfo", "vinInfo.type", "vinInfo.emissions",
                    "primaryColor", "secondaryColor", "fmvMasters.id", "fmvMasters.vinId", "fmvMasters.vinFirstHalf", "fmvMasters.year", "fmvMasters.price", "fmvMasters.valueType",
                    "fmvMasters.source", "fmvMasters.dateEntered", "document.id", "document.fileName",
                ])
                .where("ticket.id = :id AND ticket.isDeleted = false", { id: forms.ticketId });

            if (forms.type === FormType.BASIC_INFO_FORM) {
                query = query
                    .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                    .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                    .leftJoinAndSelect("basicInfo.customer", "customer")
                    .leftJoinAndSelect("basicInfo.customerContacts", "customerContacts")
                    .select([
                        "ticket.startDate", "ticket.id", "ticket.invoiceId",
                        "basicInfo.id", "basicInfo.client", "basicInfo.unit", "basicInfo.transactionTypeId",
                        "basicInfo.ticketId", "basicInfo.customerContactInfoId", "basicInfo.customerId",
                        "basicInfo.customerTransactionType", "basicInfo.isTitle", "basicInfo.isRegistration",
                        "basicInfo.isIrp", "basicInfo.isConditionalTitle",
                        "transactionType.id", "transactionType.name", "transactionType.isDeleted",
                        "customer.id", "customer.name", "customer.isDeleted",
                        "customerContacts.id", "customerContacts.name", "customerContacts.role", "customerContacts.isDeleted"
                    ]);
            }

            if (forms.type === FormType.TITLE_INFO_FORM) {
                query = query
                    .leftJoin("ticket.titleInfo", "titleInfo")
                    .leftJoin("titleInfo.titleState", "titleState")
                    .addSelect([
                        "titleInfo.id", "titleInfo.ticketId", "titleInfo.stateId", "titleInfo.currentTitle",
                        "titleInfo.isNew", "titleInfo.brands", "titleInfo.odometerCode", "titleInfo.odometerReading",
                        "titleInfo.odometerUnit", "titleInfo.odometerDate", "titleState.id", "titleState.name",
                        "titleState.code", "titleState.fieldName", "titleState.location", "titleState.titleFormat"
                    ]);
            }
            if (forms.type === FormType.INSURANCE_INFO_FORM) {
                query = query
                    .leftJoinAndSelect("ticket.insuranceInfo", "insuranceInfo")
                    .select([
                        "ticket.startDate", "ticket.id", "ticket.invoiceId",
                        "insuranceInfo.id", "insuranceInfo.ticketId", "insuranceInfo.companyName",
                        "insuranceInfo.effectiveDate", "insuranceInfo.expirationDate", "insuranceInfo.policyNumber",
                        "insuranceInfo.type"
                    ])
                    .where("ticket.id = :id AND ticket.isDeleted = false", { id: forms.ticketId });
            }

            if (forms.type === FormType.LIEN_INFO_FORM) {
                query = this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoinAndSelect("ticket.lienInfo", 'lienInfo', "lienInfo.isDeleted = false")
                    .leftJoin("lienInfo.lien", "lien", "lien.isDeleted = false")
                    .select(["ticket.id", "lienInfo.lienId", "lienInfo.idOption", "lienInfo.licenseNumber",
                        "lienInfo.firstName", "lienInfo.middleName", "lienInfo.lastName", "lienInfo.suffix", "lienInfo.isElt"
                    ])
                    .where('ticket.id = :id AND ticket.isDeleted = false', { id: forms.ticketId });

                const result = await query.getOne();
                return result;
            }
            if (forms.type === FormType.REGISTRATION_INFO_FORM) {
                query = this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoinAndSelect("ticket.registrationInfo", "regInfo")
                    .leftJoinAndSelect("regInfo.plate", "plate")
                    .select([
                        "ticket.id", "ticket.startDate",
                        "regInfo.id", "regInfo.ticketId", "regInfo.plateTypeId", "regInfo.plateTransfer", "regInfo.plateNumber",
                        "regInfo.expirationDate", "regInfo.gvw", "regInfo.veteranExempt", "regInfo.initialTotalCost",
                        "regInfo.emissionVerified", "regInfo.isRenewTwoYears", "regInfo.isHighwayImpact50", "regInfo.isHighwayImpact100",
                        "regInfo.isAlternativeFuelFee", "regInfo.isRenewTwoYearsRegExp", "regInfo.isForHire", "regInfo.costCalc",
                        "regInfo.line2209", "regInfo.mailingAddress", "regInfo.is2290",
                        "plate.id", "plate.plateDetails", "plate.categoryCode",
                        "regInfo.type", "regInfo.primaryFuelType", "regInfo.secondaryFuelType",
                    ])
                    .where("ticket.id = :id AND ticket.isDeleted = false", { id: forms.ticketId });

            }
            if (forms.type === FormType.TRADE_IN_INFO_FORM) {
                query = query
                    .leftJoin("ticket.tradeInInfo", "tradeInInfo", "tradeInInfo.isDeleted = false")
                    .addSelect(["tradeInInfo.id", "tradeInInfo.odometerCode", "tradeInInfo.lastOdometerReading",
                        "tradeInInfo.tradeInAllowance", "tradeInInfo.vinNumber"
                    ]);
            }
            if (forms.type === FormType.SELLER_INFO_FORM) {
                query = this.manager.createQueryBuilder(Tickets, 'ticket')
                    .leftJoinAndSelect("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted = false")
                    .select(["ticket.id", "sellerInfo.id", "sellerInfo.sellerId", "sellerInfo.name",
                        "sellerInfo.isDealership", "sellerInfo.sellerType", "sellerInfo.dealerId",
                        "sellerInfo.salesTaxId", "sellerInfo.address"
                    ])
                    .where('ticket.id = :id AND ticket.isDeleted = false', { id: forms.ticketId });

                const result = await query.getOne();
                return result;
            }

            if (forms.type === FormType.BUYER_INFO_FORM) {
                query = query
                    .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                    .leftJoinAndSelect("buyerInfo.county", "county")
                    .leftJoinAndSelect("county.countyCheatSheet", "countyCheatSheet")
                    .leftJoinAndSelect("buyerInfo.secCounty", "secCounty")
                    .select([
                        "ticket.id", "buyerInfo.id", "buyerInfo.type", "buyerInfo.name", "buyerInfo.secondaryType", "buyerInfo.secondaryName",
                        "buyerInfo.address", "buyerInfo.mailingAddress", "buyerInfo.email", "buyerInfo.phone",
                        "buyerInfo.secondaryEmail", "buyerInfo.secondaryPhone", "buyerInfo.firstName", "buyerInfo.middleName",
                        "buyerInfo.lastName", "buyerInfo.suffix", "buyerInfo.dob", "buyerInfo.ticketId", "buyerInfo.idOption",
                        "buyerInfo.license", "buyerInfo.expireDate", "buyerInfo.isActive", "buyerInfo.isLessee",
                        "buyerInfo.isMilitary", "buyerInfo.taxExempt", "buyerInfo.isSecondary", "buyerInfo.activeDutyMilitaryStationedInGa",
                        "buyerInfo.secActiveDutyMilitaryStationedInGa", "buyerInfo.secondaryTaxExempt", "buyerInfo.secFirstName",
                        "buyerInfo.secMiddleName", "buyerInfo.secLastName", "buyerInfo.secSuffix", "buyerInfo.secDob",
                        "buyerInfo.secIdOption", "buyerInfo.secLicense", "buyerInfo.secExpireDate", "buyerInfo.secIsMilitary",
                        "buyerInfo.secAddress", "buyerInfo.secMailingAddress", "buyerInfo.isPrimeAddClone", "buyerInfo.isSecAddClone",
                        "buyerInfo.isOwner", "buyerInfo.purchaseType", "buyerInfo.secPurchaseType",
                        "buyerInfo.district", "buyerInfo.secDistrict", "county.id", "county.name", "secCounty.id", "secCounty.name", "countyCheatSheet.emission",
                        "buyerInfo.isPrimary", "buyerInfo.isLessor"
                    ])
                    .where("ticket.id = :id AND ticket.isDeleted = false", { id: forms.ticketId });
            }

            const ticket = await query.getOne();
            if (!ticket) {
                throw new NotFoundException(`ERR_TICKET_NOT_FOUND`)
            }

            const tradeInInfo = ticket.tradeInInfo ? ticket.tradeInInfo.sort((a, b) => a.id - b.id) : null;
            const lienInfo = ticket.lienInfo ? ticket.lienInfo.sort((a, b) => a.id - b.id) : null;

            const lessees = [];
            const lessors = [];
            const owner = [];

            if (ticket && Array.isArray(ticket.buyerInfo)) {
                ticket.buyerInfo.forEach((seller: any) => {
                    if (seller.isOwner && !seller.isLessee && !seller.isLessor) {
                        owner.push(seller);
                    } else if (seller.isLessee && !seller.isLessor && !seller.isOwner) {
                        lessees.push(seller);
                    } else if (seller.isLessor && !seller.isOwner && !seller.isLessee) {
                        lessors.push(seller)
                    }
                });
            }
            let result;
            if (forms.type === FormType.BUYER_INFO_FORM) {
                result = {
                    ...ticket,
                    lessees,
                    lessors,
                    owner,
                    buyerInfo: undefined
                };
            } else {
                result = {
                    ...ticket,
                    tradeInInfo,
                    lienInfo
                };
            }

            return result;
        } catch (error) {
            throwException(error)
        }
    }

    async getTicketAnalytics(): Promise<{
        totalTicketCount: number, newTicketCount: number, highPriorityTicketCount: number
    }> {
        try {
            const result = await this.manager.query(`
            SELECT 
                COUNT(*) AS "totalTicketCount",
                COUNT(CASE WHEN ticket."start_date" IS NULL THEN 1 END) AS "newTicketCount",
                COUNT(CASE WHEN priorityType.slug = '${SlugConstants.priorityHigh}' THEN 1 END) AS "highPriorityTicketCount"
            FROM "ticket"."tickets" AS ticket
            LEFT JOIN "master"."priority_types" AS priorityType ON ticket."priority_id" = priorityType.id
            WHERE ticket."is_deleted" = false AND ticket."is_active" = true
            `);

            return {
                totalTicketCount: parseInt(result[0].totalTicketCount),
                newTicketCount: parseInt(result[0].newTicketCount),
                highPriorityTicketCount: parseInt(result[0].highPriorityTicketCount),
            };
        } catch (error) {
            throwException(error);
        }
    }

    async updateTicketsDetail(dto, userId: number, ticketIds: number[]) {
        try {
            const { type, id } = dto
            let data: any = {};

            if (type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY || type === UpdateDataFieldTypesEnum.PRIORITY) {
                data = {
                    priorityId: id,
                    updatedBy: userId
                }
            } else if (type === UpdateDataFieldTypesEnum.UPDATE_STATUS || type === UpdateDataFieldTypesEnum.STATUS) {
                data = {
                    ticketStatusId: id,
                    sentToDmvBy: dto.sentToDmvBy,
                    sentToDmvAt: dto.sentToDmvAt,
                    updatedBy: userId
                }
            } else if (type === UpdateDataFieldTypesEnum.TEAM) {
                data = {
                    assignedToDeptId: id,
                    updatedBy: userId
                }
            }
            await this.manager.createQueryBuilder(Tickets, 'tickets')
                .update()
                .set(data)
                .where('id IN (:...ticketIds)', { ticketIds })
                .execute();

        } catch (error) {
            throwException(error);
        }
    }

    async multipleUpdateActivityLog(type: UpdateDataFieldTypesEnum, tickets: Tickets[], userId: number, newValue) {
        try {
            let data: ActivityLogPayload[] = [];

            //note - need to pass type for field name after deleting extra fields
            let fieldName;
            switch (type) {
                case UpdateDataFieldTypesEnum.UPDATE_PRIORITY:
                case UpdateDataFieldTypesEnum.PRIORITY:
                    fieldName = 'priority';
                    break;
                case UpdateDataFieldTypesEnum.UPDATE_STATUS:
                case UpdateDataFieldTypesEnum.STATUS:
                    fieldName = 'status';
                    break;
                case UpdateDataFieldTypesEnum.TEAM:
                    fieldName = 'team';
                    break;
                default:
                    break;
            }

            const baseActivityData = {
                userId,
                actionType: ActivityLogActionType.TICKET_DATA_UPDATE,
                fieldName,
                formType: null,
                newData: newValue,
                oldData: null,
                ticketId: null
            }

            if (type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY || type === UpdateDataFieldTypesEnum.PRIORITY) {
                //priority
                for (let element of tickets) {
                    const activityData = { ...baseActivityData };
                    activityData.ticketId = element.id;
                    activityData.oldData = element?.priority
                        ? { value: element.priority?.name, color: element.priority?.colorCode } : null;

                    data.push(activityData);
                }
            } else if (type === UpdateDataFieldTypesEnum.UPDATE_STATUS || type === UpdateDataFieldTypesEnum.STATUS) {
                //status
                for (let element of tickets) {
                    const activityData = { ...baseActivityData };
                    activityData.ticketId = element.id;
                    activityData.oldData = element?.ticketStatus ? element?.ticketStatus?.internalStatusName : null;

                    data.push(activityData);
                }
            } else if (type === UpdateDataFieldTypesEnum.TEAM) {
                //team
                for (let element of tickets) {
                    const activityData = { ...baseActivityData };
                    activityData.ticketId = element.id;
                    activityData.oldData = element?.assignedToDeptId ? element?.department?.name : null;

                    data.push(activityData);
                }
            }
            return { activityData: data };
        } catch (error) {
            throwException(error);
        }
    }

    //find priority/ status specific ticket data 
    async getTicketDetailsByType(ticketIds: number[], type: UpdateDataFieldTypesEnum, id: number): Promise<Tickets[]> {
        try {
            const query = this.createQueryBuilder("ticket")
                .where(`ticket.id IN (:...ticketIds)`, { ticketIds })

            if (type === UpdateDataFieldTypesEnum.UPDATE_PRIORITY || type === UpdateDataFieldTypesEnum.PRIORITY) {
                query.leftJoinAndSelect("ticket.priority", "priority")
                    .select(["ticket.id", "ticket.priorityId"])
                    .addSelect(["priority.id", "priority.colorCode", "priority.name"])
                if (id !== null) {
                    query.andWhere("(ticket.priorityId != :id OR ticket.priorityId IS NULL)", { id })
                } else {
                    query.andWhere("ticket.priorityId IS NOT NULL")
                }
            } else if (type === UpdateDataFieldTypesEnum.UPDATE_STATUS || type === UpdateDataFieldTypesEnum.STATUS) {
                query.leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                    .select(["ticket.id", "ticket.ticketStatusId"])
                    .addSelect(["ticketStatus.id", "ticketStatus.internalStatusName"])
                    .andWhere("ticket.ticketStatusId != :id", { id })

            } else if (type === UpdateDataFieldTypesEnum.TEAM) {
                query.leftJoinAndSelect("ticket.department", "department")
                    .select(["ticket.id", "ticket.assignedToDeptId"])
                    .addSelect(["department.id", "department.name"])
                if (id !== null) {
                    query.andWhere("(ticket.assignedToDeptId != :id OR ticket.assignedToDeptId IS NULL)", { id })
                } else {
                    query.andWhere("ticket.assignedToDeptId IS NOT NULL")
                }
            }
            return await query.getMany();
        } catch (error) {
            throwException(error);
        }
    }

    //ticket's assigned user check
    async getTicketAssigneeData(ticketIds: number[], userId: number, isAddOperation: boolean) {
        try {
            /* Find Tickets with given ticket ids + user id as Ticket Assigned Users */
            const data = await TicketAssignedUsers.createQueryBuilder("ticketAssignedUsers")
                .select("ticketAssignedUsers.ticketId")
                .where("(ticketAssignedUsers.ticketId IN (:...ticketIds) AND ticketAssignedUsers.userId = :userId)",
                    { ticketIds, userId })
                .getMany();

            return this.filterOutTicketData(isAddOperation, data, ticketIds);
        } catch (error) {
            throwException(error)
        }
    }

    //ticket's assigned tag check
    async getTicketTagData(ticketIds: number[], tagId: number, isAddOperation: boolean) {
        try {
            //Find Tickets with given ticket ids + tag id as Ticket Assigned tags 
            const data = await TicketTags.createQueryBuilder("tt")
                .select("tt.ticketId")
                .where("(tt.ticketId IN (:...ticketIds) AND tt.tagId = :tagId)",
                    { ticketIds, tagId })
                .getMany();

            return this.filterOutTicketData(isAddOperation, data, ticketIds);
        } catch (error) {
            throwException(error)
        }
    }

    //filter out ticket ids based on add/remove action performed
    filterOutTicketData(isAddOperation: boolean, data: any, ticketIds: number[]) {
        let arr = []
        if (isAddOperation) {
            // Add flow: Only Tickets which don't have the given tag as assigned tag will be returned.
            arr = ticketIds.filter(elem => !data.map(e => e.ticketId).includes(elem))
        } else {
            // Remove flow: Only Tickets which have the given tag as assigned tag will be returned. 
            arr = (data.length !== ticketIds.length ? data.map(e => e.ticketId) : ticketIds);
        }
        return arr;
    }

    //need to delete once new APIs running correctly
    /**
     * Fetches all tickets based on the provided filter criteria.
     *
     * @param filterDto - An object containing the filter criteria, such as offset, limit, order direction, order by, status IDs, department IDs, priority IDs, search, group by, task start date range, document received date range, purchase date range, assigned user IDs, tag IDs, and "Me Mode" flag.
     * @param userId - The ID of the logged-in user.
     * @returns An object containing the fetched tickets and pagination information.
     */
    async fetchAllTicketsOld(filterDto, userId: number): Promise<{ tickets: Tickets[]; page: object }> {
        try {
            let { offset, limit, orderDir, orderBy, statusIds, departmentIds, priorityIds, search, groupBy, taskStartToDate, taskStartFromDate, fromDocReceivedDate, toDocReceivedDate, toPurchaseDate, fromPurchaseDate, assignedUserIds, tagIds, isMeMode, onlyGroupingData } = filterDto;

            const take = limit ? parseInt(limit) : null;
            const skip = offset ? parseInt(offset) : null;
            isMeMode = isMeMode === 'true';
            onlyGroupingData = onlyGroupingData === 'true';
            const groupByValue = groupBy ? parseInt(groupBy) : null;
            const mainTicketCondition = `(ticket.isDeleted = false AND ticket.isActive = true)`

            let searchKeyword;
            let integerSearch;
            let exactSearchKeyword;
            let listQueryConditions = [];
            let departmentArr = [];
            let assignedUsersArr = [];
            let tagArr = [];
            let groupingQueryConditions = [];
            let parametersArray = [];
            let statusCondition;
            let priorityCondition;

            // Status ids must not be null as it's a mandatory field
            if (statusIds === 'null') {
                throw new BadRequestException(`ERR_INVALID_GROUPING_FILTER&&&statusIds&&&ERROR_MESSAGE`);
            }

            // Priority id can not be null without "group by priority" applied
            if (priorityIds === 'null' && (!groupByValue || groupByValue !== TaskGroupByEnum.PRIORITY)) {
                throw new BadRequestException(`ERR_INVALID_GROUPING_FILTER&&&priorityIds&&&ERROR_MESSAGE`);
            }

            // functions to get array of ids for filter
            const validateFilterIds = (filterIds) => [...new Set([].concat(filterIds).map(Number))];

            const validateFilterIdsWithNull = (filterIds) => {
                filterIds = [...new Set([].concat(filterIds))];
                const isNullExists = filterIds?.some(id => id === 'null'); // Check if any null value exists

                const uniqueIds = filterIds.filter(id => id !== 'null').map(Number);
                return { isNullExists, uniqueIds };
            };
            const listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoin("ticket.ticketStatus", "ticketStatus")
                .leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser")
                .leftJoin("ticketAssignedUser.assignedUser", "assignedUser")
                .leftJoin("assignedUser.avatarColor", "avatarColor")
                .leftJoin("ticket.department", "department")
                .leftJoin("ticket.carrierType", "carrierType")
                .leftJoin("ticket.priority", "priority")
                .leftJoin("ticket.ticketTag", "ticketTag")
                .leftJoin("ticketTag.tag", "tag")
                .leftJoin("ticket.customer", "customer")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.ticketDocument", "ticketDocument",
                    "ticketDocument.isDeleted = false and ticketDocument.isSigned = false and ticketDocument.isBillingDoc = false")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                .leftJoin("buyerInfo.county", "county")
                .leftJoin("county.state", "state")
                .select([
                    "ticket.id", "ticket.ticketStatusId", "ticket.assignedToDeptId", "ticket.customerId", "ticket.priorityId", "ticket.carrierTypesId", "ticket.trackingId", "ticket.docReceivedDate", "ticket.startDate", "ticket.endDate", "ticket.sentToDmvAt", "ticket.sentToDmvBy", "ticket.isActive", "ticket.purchaseDate",
                    "ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.slug", "ticketStatus.order",
                    "ticketAssignedUser.id", "ticketAssignedUser.ticketId", "ticketAssignedUser.userId",
                    "assignedUser.id", "assignedUser.firstName", "assignedUser.lastName", "assignedUser.isDeleted", "assignedUser.colorId", "avatarColor",
                    "department.id", "department.name",
                    "priority.id", "priority.name", "priority.colorCode", "priority.order",
                    "ticketTag.id", "ticketTag.tagId",
                    "tag.name",
                    "ticketDocument.id",
                    "vinInfo.id", "vinInfo.vinNumber",
                    "customer.id", "customer.name", "customer.email",
                    "carrierType.name",
                    "basicInfo.id", "basicInfo.transactionTypeId",
                    "transactionType.id", "transactionType.name", "transactionType.transactionCode",
                    "buyerInfo.countyId",
                    "county.stateId",
                    "state.code"
                ])
                .where(mainTicketCondition)

            //search filter
            if (search) {
                searchKeyword = `%${search}%`;
                exactSearchKeyword = `${search}`;

                let searchCondition = `(customer.name ILIKE :search) OR (customer.email ILIKE :search) OR (LOWER(vinInfo.vinNumber) ILIKE :exactSearch) OR (LOWER(ticket.trackingId) ILIKE :exactSearch) OR (state.code ILIKE :search)`;

                const params: any = { search: searchKeyword, exactSearch: exactSearchKeyword };

                //if search value id number then filter for ticket's id
                integerSearch = convertToNumberIfNumeric(search);
                if (typeof integerSearch === 'number') {
                    searchCondition = `(ticket.id = :integerSearch) OR ` + searchCondition;
                    params.integerSearch = integerSearch;
                }

                listQueryConditions.push(`(${searchCondition})`);
                parametersArray.push(params);
                if (groupByValue) {
                    groupingQueryConditions.push(`(${searchCondition})`)
                }
            }

            //start date filter
            if (taskStartToDate != null && taskStartFromDate != null) {
                let condition;

                if (taskStartToDate === taskStartFromDate) {
                    //same day
                    condition = `DATE("ticket"."start_date") = :taskStartFromDate`;
                } else {
                    //date range
                    const dateRangeCondition = `("ticket"."start_date" BETWEEN :taskStartFromDate AND :taskStartToDate)`;
                    const specificDateConditions = `(DATE("ticket"."start_date") = :taskStartFromDate OR DATE("ticket"."start_date") = :taskStartToDate)`;

                    condition = `(${dateRangeCondition} OR ${specificDateConditions})`;
                }

                listQueryConditions.push(condition);
                parametersArray.push({ taskStartFromDate, taskStartToDate });
                if (groupByValue) {
                    groupingQueryConditions.push(condition)
                }
            }
            //doc received date filter
            if (fromDocReceivedDate != null && toDocReceivedDate != null) {
                let condition;

                if (fromDocReceivedDate === toDocReceivedDate) {
                    //same day
                    condition = `(DATE("ticket"."doc_received_date") = :fromDocReceivedDate)`;
                } else {
                    //date range
                    const dateConditionRange = `("ticket"."doc_received_date" BETWEEN :fromDocReceivedDate AND :toDocReceivedDate)`;
                    const dateConditionSpecific = `(DATE("ticket"."doc_received_date") = :fromDocReceivedDate OR DATE("ticket"."doc_received_date") = :toDocReceivedDate)`;
                    condition = `(${dateConditionRange} OR ${dateConditionSpecific})`;
                }

                listQueryConditions.push(condition);
                parametersArray.push({ fromDocReceivedDate, toDocReceivedDate })
                if (groupByValue) {
                    groupingQueryConditions.push(condition)
                }
            }
            //purchase date filter
            if (fromPurchaseDate != null && toPurchaseDate != null) {
                let condition;
                if (fromPurchaseDate === toPurchaseDate) {
                    //same day
                    condition = `(DATE("ticket"."purchase_date") = :fromPurchaseDate)`;
                } else {
                    //date range
                    const rangeCondition = `("ticket"."purchase_date" BETWEEN :fromPurchaseDate AND :toPurchaseDate)`;
                    const specificDateConditions = `(DATE("ticket"."purchase_date") = :fromPurchaseDate OR DATE("ticket"."purchase_date") = :toPurchaseDate)`;
                    condition = `(${rangeCondition} OR ${specificDateConditions})`
                }

                listQueryConditions.push(condition);
                parametersArray.push({ fromPurchaseDate, toPurchaseDate })
                if (groupByValue) {
                    groupingQueryConditions.push(condition)
                }
            }
            // Assigned department filter
            if (departmentIds?.length) {
                departmentArr = validateFilterIds(departmentIds);
                if (departmentArr.length) {
                    const departmentCondition = `(ticket.assignedToDeptId IN (:...departmentArr))`

                    listQueryConditions.push(departmentCondition);
                    parametersArray.push({ departmentArr: departmentArr })
                    if (groupByValue) {
                        groupingQueryConditions.push(departmentCondition)
                    }
                }
            }
            // Tag filter
            if (tagIds?.length) {
                tagArr = validateFilterIds(tagIds);
                if (tagArr.length) {
                    const tagCondition = `(ticketTag.tagId IN (:...tagArr))`

                    listQueryConditions.push(tagCondition)
                    parametersArray.push({ tagArr: tagArr })
                    if (groupByValue) {
                        groupingQueryConditions.push(tagCondition)
                    }
                }
            }
            // Either 'Assigned users' OR 'Me Mode' filter
            if (isMeMode) {
                const meMOdeCondition = `(ticketAssignedUser.userId = :loggedInUser)`;
                listQueryConditions.push(meMOdeCondition)
                parametersArray.push({ loggedInUser: userId })
                if (groupByValue) {
                    groupingQueryConditions.push(meMOdeCondition)
                }
            } else if (assignedUserIds?.length) {
                assignedUsersArr = validateFilterIds(assignedUserIds);
                if (assignedUsersArr.length) {
                    const assigneeCondition = `(ticketAssignedUser.userId IN (:...assignedUsersArr))`

                    listQueryConditions.push(assigneeCondition)
                    parametersArray.push({ assignedUsersArr: assignedUsersArr })
                    if (groupByValue) {
                        groupingQueryConditions.push(assigneeCondition)
                    }
                }
            }
            //status filter
            if (statusIds?.length) {
                statusIds = validateFilterIds(statusIds);
                if (statusIds.length) {
                    statusCondition = `(ticket.ticketStatusId IN (:...statusArr))`

                    if (!onlyGroupingData) {
                        listQueryConditions.push(statusCondition)
                    }

                    //note : don't filter out status wise for grouping data if 'group by status' is applied
                    if (groupByValue !== TaskGroupByEnum.STATUS) {
                        groupingQueryConditions.push(statusCondition)
                    }
                    parametersArray.push({ statusArr: statusIds })
                }
            }

            //priority filter
            if (priorityIds) {
                if (priorityIds === 'null') {
                    priorityCondition = `(ticket.priorityId IS NULL)`;
                    listQueryConditions.push(priorityCondition)
                    //filter out priority wise data for 'group by priority' is not applied
                    if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                        groupingQueryConditions.push(priorityCondition)
                    }
                } else if (priorityIds?.length) {
                    const { isNullExists, uniqueIds } = validateFilterIdsWithNull(priorityIds);
                    if (uniqueIds.length) {
                        priorityCondition = `(ticket.priorityId IN (:...priorityArr))`;

                        if (isNullExists) {
                            priorityCondition += ` OR ticket.priorityId IS NULL`;
                        }

                        if (!onlyGroupingData) {
                            listQueryConditions.push(priorityCondition)
                        }

                        //note : don't filter out priority wise for grouping data if 'group by priority' is applied
                        if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                            groupingQueryConditions.push(priorityCondition)
                        }
                        parametersArray.push({ priorityArr: uniqueIds })
                    }
                }
            }

            //pagination
            if (take && skip !== null) {
                listQuery.take(take).skip(take * skip)
            }

            // function for conditional based sorting
            const applyOrdering = (listQuery, orderBy, orderDir) => {
                switch (orderBy) {
                    case TicketOrderByEnum.CARRIER_TYPE:
                        listQuery.orderBy('carrierType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.carrierTypesId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.CUSTOMER:
                        listQuery.orderBy('customer.name', orderDir, 'NULLS LAST')
                            .addOrderBy('customer.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.PRIORITY:
                        listQuery.orderBy('priority.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.priorityId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.STATUS:
                        listQuery.orderBy('ticketStatus.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.ticketStatusId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.DATE_RECEIVED:
                        listQuery.orderBy('ticket.docReceivedDate', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.TRANSACTION_TYPE:
                        listQuery.orderBy('transactionType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('transactionType.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    default:
                        //Sorting by 'id' will be managed here too.
                        listQuery.orderBy('ticket.id', orderDir);
                        break;
                }
            };
            // sorting
            applyOrdering(listQuery, orderBy ?? TicketOrderByEnum.ID, orderDir ?? OrderDir.DESC);

            listQueryConditions.forEach(condition => {
                listQuery.andWhere(condition);
            });

            if (parametersArray.length) {
                listQuery.setParameters(Object.assign({}, ...parametersArray))
            }

            const [tickets, totalTickets] = await listQuery.getManyAndCount();

            if (filterDto) {
                // Apply the same filters to the groupByDataQuery if group by applied 
                if (groupByValue) {
                    const groupByDataQuery = this.manager.createQueryBuilder(Tickets, 'ticket')
                        .where(mainTicketCondition)

                    if (groupByValue === TaskGroupByEnum.STATUS) {
                        // For status-wise grouped ticket counts
                        groupByDataQuery.leftJoin("ticket.ticketStatus", "ticketStatus",
                            "ticket.ticketStatusId = ticketStatus.id")
                            .select("ticket.ticketStatusId as id, ticketStatus.internalStatusName as name, ticketStatus.order as order")
                            .groupBy("ticket.ticketStatusId, ticketStatus.id, ticketStatus.order")
                            .orderBy('ticketStatus.order', 'ASC')

                    } else if (groupByValue === TaskGroupByEnum.PRIORITY) {
                        // For priority-wise grouped ticket counts
                        groupByDataQuery.leftJoin("ticket.priority", "priority", "ticket.priorityId = priority.id")
                            .select("ticket.priorityId as id, priority.name as name, priority.order as order, priority.colorCode as colorCode")
                            .groupBy("ticket.priorityId, priority.name, priority.order, priority.colorCode")
                            .orderBy('priority.order', 'ASC')
                    }

                    //search filter
                    if (search) {
                        groupByDataQuery.leftJoin("ticket.customer", "customer", "customer.id = ticket.customerId")
                            .leftJoin("ticket.vinInfo", "vinInfo", "vinInfo.id = ticket.vinId")
                            .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                            .leftJoin("buyerInfo.county", "county")
                            .leftJoin("county.state", "state")
                    }
                    //tag filter
                    if (tagArr.length) {
                        groupByDataQuery.leftJoin("ticket.ticketTag", "ticketTag", "ticketTag.ticketId = ticket.id")
                    }
                    //Either Assigned users filter OR Me Mode
                    if (assignedUsersArr.length || isMeMode) {
                        groupByDataQuery.leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser",
                            "ticketAssignedUser.ticketId = ticket.id")
                    }

                    //apply filter conditions
                    groupingQueryConditions.forEach(condition => {
                        groupByDataQuery.andWhere(condition);
                    });

                    /**********************************************************************
                     We don't need to apply groupBy specific filtration in the group query
                     as we need all priority/status tickets count for grouping data query 
                    ***********************************************************************/
                    if (parametersArray.length) {
                        const key = groupByValue === TaskGroupByEnum.PRIORITY ? 'priorityArr' : 'statusArr';
                        const flattenedParams = Object.assign({}, ...parametersArray.filter(param => !(key in param)));
                        groupByDataQuery.setParameters(flattenedParams);
                    }

                    const groupingData = await groupByDataQuery.addSelect("COUNT(DISTINCT ticket.id) as count")
                        .getRawMany();

                    if (groupingData.length > 0 && groupByValue === TaskGroupByEnum.PRIORITY) {
                        const nullIndex = groupingData.findIndex(e => e.id === null);

                        //If non-priority data found then set name & shift position to the end
                        if (nullIndex !== -1) {
                            groupingData[nullIndex].name = GeneralConst.groupByNoPriority;
                            const [nullItem] = groupingData.splice(nullIndex, 1);
                            groupingData.push(nullItem);
                        }
                    }
                    filterDto.groupingData = groupingData; //grouping data
                }
                filterDto.count = totalTickets; //count of total tickets
            }

            return { tickets, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    //assign ticket to logged in user is not a assignee
    async addAssigneeIfNotAlreadyAdded(ticketId: number, userId: number) {
        try {
            const checkAssigneeExist = await checkTicketAssigneeExists(ticketId, userId);
            if (!checkAssigneeExist) {
                await this.addAssignee({ ticketId, userId: userId, createdBy: userId })

                // Emit data => ticket
                const latestTicketData = await this.getTicketDetails(ticketId);
                this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTicketData, DataEntryFormType.TICKET_INFO);

                //activity log
                const automaticAssigneeAddLog: ActivityLogPayload = {
                    fieldName: 'assignee',
                    ticketId,
                    actionType: ActivityLogActionType.AUTO_UPDATE,
                    newData: `${userId}`,
                    formType: null,
                    userId: null,
                    oldData: null
                }
                this.activityLogService.addActivityLog(automaticAssigneeAddLog, [], SocketEventEnum.FORM_DATA_UPDATE);
            }

        } catch (error) {
            throwException(error);
        }
    }


    //assign ticket to logged in user is not a assignee
    async addAssigneeIfNotAlreadyAddedMultiple(ticketIds: number[], userId: number) {
        try {
            const unassignedTickets = await checkMultipleTicketAssigneeExists(ticketIds, userId);
            if (unassignedTickets.length) {
                let arr = [];
                for (let element of unassignedTickets) {
                    arr.push({
                        ticketId: element,
                        userId: userId,
                        createdBy: null
                    });
                }
                if (arr.length) {
                    await this.addAssignee(arr)
                }

                const automaticAssigneeAddLog: ActivityLogPayload[] = [];

                for (let ticket of unassignedTickets) {
                    automaticAssigneeAddLog.push({
                        fieldName: 'assignee',
                        ticketId: ticket,
                        actionType: ActivityLogActionType.AUTO_UPDATE,
                        newData: `${userId}`,
                        formType: null,
                        userId: null,
                        oldData: null
                    })
                }
                if (automaticAssigneeAddLog.length > 0) {
                    this.activityLogService.addActivityLog(
                        automaticAssigneeAddLog, [], SocketEventEnum.FORM_DATA_UPDATE);
                }
            }
        } catch (error) {
            throwException(error);
        }
    }

    async removeAllAssignedData(repository, ticketId: number) {
        try {
            const removedDataCount = await repository.createQueryBuilder()
                .delete()
                .where("ticketId = :ticketId", { ticketId })
                .execute();
            return removedDataCount;
        } catch (error) {
            throw new BadRequestException(`ERR_DELETING_DATA&&&&&&ERROR_MESSAGE`);
        }
    }

    async deleteDocuments(deleteDocument, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TicketDocuments,
                deleteDocument,
                userId,
                success.SUC_DOCUMENT_DELETED,
                error.ERR_DOCUMENT_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    /**
 * Retrieves a list of tickets based on the provided filter criteria.
 *
 * @param filterDto - An object containing the filter parameters, such as offset, limit, orderDir, orderBy, statusIds, priorityIds, groupBy, search, departmentIds, taskStartToDate, taskStartFromDate, fromDocReceivedDate, toDocReceivedDate, toPurchaseDate, fromPurchaseDate, assignedUserIds, tagIds, isMeMode, and onlyGroupingData.
 * @param userId - The ID of the user making the request.
 * @returns An object containing the filtered tickets and pagination information.
 */
    async fetchAllTickets(filterDto, userId: number): Promise<{ tickets: Tickets[]; page: object }> {
        try {
            let { offset, limit, orderDir, orderBy, statusIds, priorityIds, groupBy, search, departmentIds, taskStartToDate, taskStartFromDate, fromDocReceivedDate, toDocReceivedDate, toPurchaseDate, fromPurchaseDate, assignedUserIds, tagIds, isMeMode, onlyGroupingData } = filterDto;

            // Status ids must not be null as it's a mandatory field
            if (statusIds === 'null') {
                throw new BadRequestException(`ERR_INVALID_GROUPING_FILTER&&&statusIds&&&ERROR_MESSAGE`);
            }

            const take = limit ? parseInt(limit) : null;
            const skip = offset ? parseInt(offset) : null;
            const groupByValue = groupBy ? parseInt(groupBy) : null;

            let searchKeyword: string;
            let integerSearch: number;
            let assignedUsersArr = [];
            let exactSearchKeyword;
            let tagArr = [];
            let departmentArr = [];
            let listQueryConditions = [];
            let groupingQueryConditions = [];
            let parametersArray = [];
            let statusCondition: string;
            let priorityCondition: string;

            isMeMode = isMeMode === 'true';
            onlyGroupingData = onlyGroupingData = onlyGroupingData === 'true';
            //AND (ticketStatus.slug != '${SlugConstants.ticketStatusReadyForBatchPrep}' OR ticketStatus.slug IS NULL)
            const mainTicketCondition = `(ticket.isDeleted = false AND ticket.isActive = true)`;

            const listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
            let [ticketsData, totalTickets] = [[], 0];

            //  Helper function : conditional sorting
            const applyOrdering = (listQuery, orderBy, orderDir) => {
                switch (orderBy) {
                    case TicketOrderByEnum.CARRIER_TYPE:
                        listQuery.orderBy('carrierType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.carrierTypesId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.CUSTOMER:
                        listQuery.orderBy('customer.name', orderDir, 'NULLS LAST')
                            .addOrderBy('customer.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.PRIORITY:
                        listQuery.orderBy('priority.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.priorityId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.STATUS:
                        listQuery.orderBy('ticketStatus.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.ticketStatusId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.DATE_RECEIVED:
                        listQuery.orderBy('ticket.docReceivedDate', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.TRANSACTION_TYPE:
                        listQuery.orderBy('transactionType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('transactionType.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    default:
                        //Sorting by 'id' will be managed here too.
                        listQuery.orderBy('ticket.id', orderDir);
                        break;
                }
            };

            // Helper function : Date range filters
            const applyDateFilter = (field, from, to) => {
                if (from && to) {
                    const condition = from === to
                        ? `DATE(${field}) = :fromDate`
                        : `(${field} BETWEEN :fromDate AND :toDate OR DATE(${field}) = :fromDate OR DATE(${field}) = :toDate)`;
                    if (!onlyGroupingData) {
                        listQueryConditions.push(condition);
                    }
                    if (groupByValue) {
                        groupingQueryConditions.push(condition)
                    }
                    parametersArray.push({ fromDate: from, toDate: to });
                }
            };

            // Helper Function : Filter
            /* const applyFilterCondition = (listQuery, groupQuery, condition, params) => {
              if (!onlyGroupingData) {
                  listQuery.andWhere(condition);
              }
              if (groupByValue) {
                  groupQuery.andWhere(condition);
              }
              parametersArray.push(params);
            }; */

            // Helper functions : To get array of ids for filter
            const validateFilterIds = (filterIds) => [...new Set([].concat(filterIds).map(Number))];
            const validateFilterIdsWithNull = (filterIds) => {
                filterIds = [...new Set([].concat(filterIds))];
                const isNullExists = filterIds?.some(id => id === 'null'); // Check if any null value exists
                const uniqueIds = filterIds.filter(id => id !== 'null').map(Number);

                return { isNullExists, uniqueIds };
            };

            //Note: onlyGroupingData is true then it will not return any tickets. It will only return grouping data
            if (!onlyGroupingData) {
                listQuery.leftJoin("ticket.ticketStatus", "ticketStatus")
                    .leftJoin("ticket.priority", "priority")
                    .leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser")
                    .leftJoin("ticketAssignedUser.assignedUser", "assignedUser", "assignedUser.isDeleted = false")
                    .leftJoin("assignedUser.avatarColor", "avatarColor")
                    .leftJoin("ticket.department", "department")
                    .leftJoin("ticket.carrierType", "carrierType")
                    .leftJoin("ticket.ticketTag", "ticketTag")
                    .leftJoin("ticketTag.tag", "tag")
                    .leftJoin("ticket.customer", "customer")
                    .leftJoin("ticket.vinInfo", "vinInfo")
                    .leftJoin("ticket.basicInfo", "basicInfo")
                    .leftJoin("basicInfo.transactionType", "transactionType")
                    .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                    .leftJoin("buyerInfo.county", "county")
                    .leftJoin("county.state", "state")
                    .leftJoin("ticket.ticketDocument", "ticketDocument",
                        "ticketDocument.isDeleted = false and ticketDocument.isSigned = false and ticketDocument.isBillingDoc = false")
                    .select([
                        "ticket.id", "ticket.ticketStatusId", "ticket.assignedToDeptId", "ticket.customerId", "ticket.priorityId", "ticket.carrierTypesId", "ticket.trackingId", "ticket.docReceivedDate", "ticket.startDate", "ticket.endDate", "ticket.sentToDmvAt", "ticket.sentToDmvBy", "ticket.isActive", "ticket.purchaseDate",
                        "ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.slug", "ticketStatus.order",
                        "ticketAssignedUser.id", "ticketAssignedUser.ticketId", "ticketAssignedUser.userId",
                        "assignedUser.id", "assignedUser.firstName", "assignedUser.lastName", "assignedUser.isDeleted", "assignedUser.colorId",
                        "avatarColor",
                        "department.id", "department.name",
                        "priority.id", "priority.name", "priority.colorCode", "priority.order",
                        "ticketTag.id", "ticketTag.tagId",
                        "tag.name",
                        "ticketDocument.id",
                        "vinInfo.id", "vinInfo.vinNumber",
                        "customer.id", "customer.name", "customer.email",
                        "carrierType.name",
                        "basicInfo.id", "basicInfo.transactionTypeId",
                        "transactionType.id", "transactionType.name", "transactionType.transactionCode",
                        "buyerInfo.countyId",
                        "county.stateId",
                        "state.code"
                    ])
                    .where(mainTicketCondition)
                    .groupBy("ticket.id, priority.id, ticketStatus.id, ticketAssignedUser.id, assignedUser.id, avatarColor.id, department.id, carrierType.id, ticketTag.id, tag.id, vinInfo.id, customer.id, ticketDocument.id, basicInfo.id, buyerInfo.id, county.id, state.id, transactionType.id")

                /* if (groupByValue) {
                    switch (groupByValue) {
                        case (TaskGroupByEnum.PRIORITY):
                            listQuery.addGroupBy("priority.name, priority.order, priority.colorCode")
                            break;
                        case (TaskGroupByEnum.STATUS):
                            listQuery.addGroupBy("ticketStatus.order")
                            break;
                    }
                } */
            }

            //search filter
            if (search) {
                searchKeyword = `%${search}%`;
                exactSearchKeyword = `${search}`;

                let searchCondition = `(customer.name ILIKE :search) OR (state.code ILIKE :search) OR (transactionType.name ILIKE :search) OR (transactionType.transactionCode ILIKE :search) OR (customer.email ILIKE :search) OR (LOWER(vinInfo.vinNumber) ILIKE :exactSearch) OR (LOWER(ticket.trackingId) ILIKE :exactSearch)`;

                const params: any = { search: searchKeyword, exactSearch: exactSearchKeyword };

                //if search value is number then filter for ticket's id
                integerSearch = convertToNumberIfNumeric(search);
                if (typeof integerSearch === 'number') {
                    searchCondition = `(ticket.id = :integerSearch) OR ` + searchCondition;
                    params.integerSearch = integerSearch;
                }

                if (!onlyGroupingData) {
                    listQueryConditions.push(`(${searchCondition})`);
                }
                if (groupByValue) {
                    groupingQueryConditions.push(`(${searchCondition})`)
                }
                parametersArray.push(params);
            }

            //Date Filters [start date, received date, purchase date]
            applyDateFilter("ticket.startDate", taskStartFromDate, taskStartToDate);
            applyDateFilter("ticket.docReceivedDate", fromDocReceivedDate, toDocReceivedDate);
            applyDateFilter("ticket.purchaseDate", fromPurchaseDate, toPurchaseDate);

            // Assigned department filter
            if (departmentIds?.length) {
                departmentArr = validateFilterIds(departmentIds);
                const departmentCondition = `(ticket.assignedToDeptId IN (:...departmentArr))`

                if (!onlyGroupingData) {
                    listQueryConditions.push(departmentCondition);
                }
                if (groupByValue) {
                    groupingQueryConditions.push(departmentCondition)
                }
                parametersArray.push({ departmentArr: departmentArr })
            }

            // Tag filter
            if (tagIds?.length) {
                tagArr = validateFilterIds(tagIds);
                const tagCondition = `(ticketTag.tagId IN (:...tagArr))`

                if (!onlyGroupingData) {
                    listQueryConditions.push(tagCondition)
                }
                if (groupByValue) {
                    groupingQueryConditions.push(tagCondition)
                }
                parametersArray.push({ tagArr: tagArr })
            }

            //status filter
            if (statusIds?.length) {
                statusIds = validateFilterIds(statusIds);
                if (statusIds.length) {
                    statusCondition = `(ticket.ticketStatusId IN (:...statusArr))`

                    if (!onlyGroupingData) {
                        listQueryConditions.push(statusCondition)
                    }

                    //note : don't filter out status wise for grouping data if 'group by status' is applied
                    if (groupByValue !== TaskGroupByEnum.STATUS) {
                        groupingQueryConditions.push(statusCondition)
                    }
                    parametersArray.push({ statusArr: statusIds })
                }
            }

            //priority filter
            if (priorityIds) {
                if (priorityIds === 'null') {
                    priorityCondition = `(ticket.priorityId IS NULL)`;
                    listQueryConditions.push(priorityCondition)
                    //filter out priority wise data for 'group by priority' is not applied
                    if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                        groupingQueryConditions.push(priorityCondition)
                    }
                } else if (priorityIds?.length) {
                    const { isNullExists, uniqueIds } = validateFilterIdsWithNull(priorityIds);
                    if (uniqueIds.length) {
                        if (!isNullExists) {
                            priorityCondition = `(ticket.priorityId IN (:...priorityArr))`;
                        } else {
                            priorityCondition = `(ticket.priorityId IN (:...priorityArr) OR ticket.priorityId IS NULL)`;

                        }

                        if (!onlyGroupingData) {
                            listQueryConditions.push(priorityCondition)
                        }

                        //note : don't filter out priority wise for grouping data if 'group by priority' is applied
                        if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                            groupingQueryConditions.push(priorityCondition)
                        }
                        parametersArray.push({ priorityArr: uniqueIds })
                    }
                }
            }

            // Either 'Assigned users' OR 'Me Mode' filter
            if (isMeMode) {
                const meMOdeCondition = `(ticketAssignedUser.userId = :loggedInUser)`;
                if (!onlyGroupingData) {
                    listQueryConditions.push(meMOdeCondition)
                }
                if (groupByValue) {
                    groupingQueryConditions.push(meMOdeCondition)
                }
                parametersArray.push({ loggedInUser: userId })
            } else if (assignedUserIds?.length) {
                assignedUsersArr = validateFilterIds(assignedUserIds);

                if (assignedUsersArr.length) {
                    const assigneeCondition = `(ticketAssignedUser.userId IN (:...assignedUsersArr))`
                    if (!onlyGroupingData) {
                        listQueryConditions.push(assigneeCondition)
                    }
                    if (groupByValue) {
                        groupingQueryConditions.push(assigneeCondition)
                    }
                    parametersArray.push({ assignedUsersArr: assignedUsersArr })
                }
            }

            if (!onlyGroupingData) {
                //pagination
                if (take && skip !== null) {
                    listQuery.take(take).skip(take * skip)
                }

                applyOrdering(listQuery, orderBy ?? TicketOrderByEnum.ID, orderDir ?? OrderDir.DESC);
                listQuery.addOrderBy('ticketAssignedUser.id', 'DESC')
                    .addOrderBy('ticketTag.id', 'DESC')

                //apply filter conditions
                listQueryConditions.forEach(condition => {
                    listQuery.andWhere(condition);
                });
                if (parametersArray.length) {
                    listQuery.setParameters(Object.assign({}, ...parametersArray))
                }
                [ticketsData, totalTickets] = await listQuery.getManyAndCount();

                // manipulate response for grouping data
                if (groupByValue) {
                    let groupedTickets;
                    if (groupByValue === TaskGroupByEnum.PRIORITY) {
                        groupedTickets = ticketsData.reduce((acc, ticket) => {
                            const priorityName = ticket?.priority?.name || GeneralConst.groupByNoPriority;
                            (acc[priorityName] ||= []).push(ticket);
                            return acc;
                        }, {});
                    } else {
                        groupedTickets = ticketsData.reduce((acc, ticket) => {
                            const statusName = ticket?.ticketStatus?.internalStatusName;
                            (acc[statusName] ||= []).push(ticket);
                            return acc;
                        }, {});
                    }
                    ticketsData = groupedTickets;
                }
            }
            if (filterDto) {
                // Apply the same filters to the groupByDataQuery if group by applied 
                if (groupByValue) {
                    const groupByDataQuery = this.manager.createQueryBuilder(Tickets, 'ticket')
                        .leftJoin("ticket.ticketStatus", "ticketStatus",
                            "ticket.ticketStatusId = ticketStatus.id")
                        .select("ticket.ticketStatusId as id, ticketStatus.slug as slug")
                        .where(mainTicketCondition)

                    if (groupByValue === TaskGroupByEnum.STATUS) {

                        // For status-wise grouped ticket counts
                        groupByDataQuery.select("ticket.ticketStatusId as id, ticketStatus.internalStatusName as name, ticketStatus.order as order")
                            .groupBy("ticket.ticketStatusId, ticketStatus.id, ticketStatus.order")
                            .orderBy('ticketStatus.order', 'ASC')

                    } else if (groupByValue === TaskGroupByEnum.PRIORITY) {
                        // For priority-wise grouped ticket counts
                        groupByDataQuery.leftJoin("ticket.priority", "priority", "ticket.priorityId = priority.id")
                            .select("ticket.priorityId as id, priority.name as name, priority.order as order, priority.colorCode as colorCode")
                            .groupBy("ticket.priorityId, priority.name, priority.order, priority.colorCode")
                            .orderBy('priority.order', 'ASC')
                    }

                    //search filter
                    if (search) {
                        groupByDataQuery.leftJoin("ticket.customer", "customer", "customer.id = ticket.customerId")
                            .leftJoin("ticket.vinInfo", "vinInfo", "vinInfo.id = ticket.vinId")
                            .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                            .leftJoin("buyerInfo.county", "county")
                            .leftJoin("county.state", "state")
                    }
                    //tag filter
                    if (tagArr.length) {
                        groupByDataQuery.leftJoin("ticket.ticketTag", "ticketTag", "ticketTag.ticketId = ticket.id")
                    }
                    //Either Assigned users filter OR Me Mode
                    if (assignedUsersArr.length || isMeMode) {
                        groupByDataQuery.leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser",
                            "ticketAssignedUser.ticketId = ticket.id")
                    }
                    /* if (taskStartFromDate && taskStartToDate) {
                        groupByDataQuery.addSelect("ticket.startDate")
                    }
                    if (toPurchaseDate && fromPurchaseDate) {
                        groupByDataQuery.addSelect("ticket.purchaseDate")
                    }
                    if (toDocReceivedDate && fromDocReceivedDate) {
                        groupByDataQuery.addSelect("ticket.docReceivedDate")
                    } */
                    //apply filter conditions
                    groupingQueryConditions.forEach(condition => {
                        groupByDataQuery.andWhere(condition);
                    });

                    /* We don't need to apply groupBy specific filtration in the group query
                     as we need all priority/status tickets count for grouping data query */
                    if (parametersArray.length) {
                        const key = groupByValue === TaskGroupByEnum.PRIORITY ? 'priorityArr' : 'statusArr';
                        const flattenedParams = Object.assign({}, ...parametersArray.filter(param => !(key in param)));
                        groupByDataQuery.setParameters(flattenedParams);
                    }

                    const groupingData = await groupByDataQuery.addSelect("COUNT(DISTINCT ticket.id) as count")
                        .getRawMany();

                    if (groupByValue === TaskGroupByEnum.PRIORITY && groupingData.length > 0) {
                        const nullIndex = groupingData.findIndex(e => e.id === null);

                        //If non-priority data found then set name & shift position to the end
                        if (nullIndex !== -1) {
                            groupingData[nullIndex].name = GeneralConst.groupByNoPriority;
                            const [nullItem] = groupingData.splice(nullIndex, 1);
                            groupingData.push(nullItem);
                        }
                    }
                    filterDto.groupingData = groupingData; //grouped data
                }
                filterDto.count = totalTickets; //count of total tickets
            }

            return {
                tickets: ticketsData, page: filterDto
            };
        } catch (error) {
            throwException(error);
        }
    }

    /* New API for fetching tickets */
    async fetchAllTicketsTest(filterDto, userId: number): Promise<{ tickets: Tickets[]; page: object }> {
        try {
            let { offset, limit, orderDir, orderBy, statusIds, priorityIds, groupBy, search, departmentIds, taskStartToDate, taskStartFromDate, fromDocReceivedDate, toDocReceivedDate, toPurchaseDate, fromPurchaseDate, assignedUserIds, tagIds, isMeMode, onlyGroupingData } = filterDto;

            // Status ids must not be null as it's a mandatory field
            if (statusIds === 'null') {
                throw new BadRequestException(`ERR_INVALID_GROUPING_FILTER&&&statusIds&&&ERROR_MESSAGE`);
            }

            const take = limit ? parseInt(limit) : null;
            const skip = offset ? parseInt(offset) : null;
            const groupByValue = groupBy ? parseInt(groupBy) : null;

            let searchKeyword: string;
            let integerSearch: number;
            let assignedUsersArr = [];
            let exactSearchKeyword;
            let tagArr = [];
            let departmentArr = [];
            let listQueryConditions = [];
            let groupingQueryConditions = [];
            let parametersArray = [];
            let statusCondition: string;
            let priorityCondition: string;

            isMeMode = isMeMode === 'true';
            onlyGroupingData = onlyGroupingData = onlyGroupingData === 'true';
            //AND (ticketStatus.slug != '${SlugConstants.ticketStatusReadyForBatchPrep}' OR ticketStatus.slug IS NULL)
            const mainTicketCondition = `(ticket.isDeleted = false AND ticket.isActive = true)`;

            const listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
            let [ticketsData, totalTickets] = [[], 0];

            //  Helper function : conditional sorting
            const applyOrdering = (listQuery, orderBy, orderDir) => {
                switch (orderBy) {
                    case TicketOrderByEnum.CARRIER_TYPE:
                        listQuery.orderBy('carrierType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.carrierTypesId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.CUSTOMER:
                        listQuery.orderBy('customer.name', orderDir, 'NULLS LAST')
                            .addOrderBy('customer.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.PRIORITY:
                        listQuery.orderBy('priority.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.priorityId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.STATUS:
                        listQuery.orderBy('ticketStatus.order', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.ticketStatusId', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.DATE_RECEIVED:
                        listQuery.orderBy('ticket.docReceivedDate', orderDir, 'NULLS LAST')
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    case TicketOrderByEnum.TRANSACTION_TYPE:
                        listQuery.orderBy('transactionType.name', orderDir, 'NULLS LAST')
                            .addOrderBy('transactionType.id', orderDir)
                            .addOrderBy('ticket.id', orderDir);
                        break;
                    default:
                        //Sorting by 'id' will be managed here too.
                        listQuery.orderBy('ticket.id', orderDir);
                        break;
                }
            };

            // Helper function : Date range filters
            const applyDateFilter = (field, from, to) => {
                if (from && to) {
                    const condition = from === to
                        ? `DATE(${field}) = :fromDate`
                        : `(${field} BETWEEN :fromDate AND :toDate OR DATE(${field}) = :fromDate OR DATE(${field}) = :toDate)`;
                    if (!onlyGroupingData) {
                        listQueryConditions.push(condition);
                    }
                    if (groupByValue) {
                        groupingQueryConditions.push(condition)
                    }
                    parametersArray.push({ fromDate: from, toDate: to });
                }
            };

            // Helper Function : Filter
            /* const applyFilterCondition = (listQuery, groupQuery, condition, params) => {
              if (!onlyGroupingData) {
                  listQuery.andWhere(condition);
              }
              if (groupByValue) {
                  groupQuery.andWhere(condition);
              }
              parametersArray.push(params);
            }; */

            // Helper functions : To get array of ids for filter
            const validateFilterIds = (filterIds) => [...new Set([].concat(filterIds).map(Number))];
            const validateFilterIdsWithNull = (filterIds) => {
                filterIds = [...new Set([].concat(filterIds))];
                const isNullExists = filterIds?.some(id => id === 'null'); // Check if any null value exists
                const uniqueIds = filterIds.filter(id => id !== 'null').map(Number);

                return { isNullExists, uniqueIds };
            };

            //Note: onlyGroupingData is true then it will not return any tickets. It will only return grouping data
            if (!onlyGroupingData) {
                listQuery.leftJoin("ticket.ticketStatus", "ticketStatus")
                    .leftJoin("ticket.priority", "priority")
                    .leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser")
                    .leftJoin("ticketAssignedUser.assignedUser", "assignedUser", "assignedUser.isDeleted = false")
                    .leftJoin("assignedUser.avatarColor", "avatarColor")
                    .leftJoin("ticket.department", "department")
                    .leftJoin("ticket.carrierType", "carrierType")
                    .leftJoin("ticket.ticketTag", "ticketTag")
                    .leftJoin("ticketTag.tag", "tag")
                    .leftJoin("ticket.customer", "customer")
                    .leftJoin("ticket.vinInfo", "vinInfo")
                    .leftJoin("ticket.basicInfo", "basicInfo")
                    .leftJoin("basicInfo.transactionType", "transactionType")
                    .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                    .leftJoin("buyerInfo.county", "county")
                    .leftJoin("county.state", "state")
                    .leftJoin("ticket.ticketDocument", "ticketDocument",
                        "ticketDocument.isDeleted = false and ticketDocument.isSigned = false and ticketDocument.isBillingDoc = false")
                    .select([
                        "ticket.id", "ticket.ticketStatusId", "ticket.assignedToDeptId", "ticket.customerId", "ticket.priorityId", "ticket.carrierTypesId", "ticket.trackingId", "ticket.docReceivedDate", "ticket.startDate", "ticket.endDate", "ticket.sentToDmvAt", "ticket.sentToDmvBy", "ticket.isActive", "ticket.purchaseDate",
                        "ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.slug", "ticketStatus.order",
                        "ticketAssignedUser.id", "ticketAssignedUser.ticketId", "ticketAssignedUser.userId",
                        "assignedUser.id", "assignedUser.firstName", "assignedUser.lastName", "assignedUser.isDeleted", "assignedUser.colorId",
                        "avatarColor",
                        "department.id", "department.name",
                        "priority.id", "priority.name", "priority.colorCode", "priority.order",
                        "ticketTag.id", "ticketTag.tagId",
                        "tag.name",
                        "ticketDocument.id",
                        "vinInfo.id", "vinInfo.vinNumber",
                        "customer.id", "customer.name", "customer.email",
                        "carrierType.name",
                        "basicInfo.id", "basicInfo.transactionTypeId",
                        "transactionType.id", "transactionType.name", "transactionType.transactionCode",
                        "buyerInfo.countyId",
                        "county.stateId",
                        "state.code"
                    ])
                    .where(mainTicketCondition)
                    .groupBy("ticket.id, priority.id, ticketStatus.id, ticketAssignedUser.id, assignedUser.id, avatarColor.id, department.id, carrierType.id, ticketTag.id, tag.id, vinInfo.id, customer.id, ticketDocument.id, basicInfo.id, buyerInfo.id, county.id, state.id, transactionType.id")

                /* if (groupByValue) {
                    switch (groupByValue) {
                        case (TaskGroupByEnum.PRIORITY):
                            listQuery.addGroupBy("priority.name, priority.order, priority.colorCode")
                            break;
                        case (TaskGroupByEnum.STATUS):
                            listQuery.addGroupBy("ticketStatus.order")
                            break;
                    }
                } */
            }

            //search filter
            if (search) {
                searchKeyword = `%${search}%`;
                exactSearchKeyword = `${search}`;

                let searchCondition = `(customer.name ILIKE :search) OR (state.code ILIKE :search) OR (transactionType.name ILIKE :search) OR (transactionType.transactionCode ILIKE :search) OR (customer.email ILIKE :search) OR (LOWER(vinInfo.vinNumber) ILIKE :exactSearch) OR (LOWER(ticket.trackingId) ILIKE :exactSearch)`;

                const params: any = { search: searchKeyword, exactSearch: exactSearchKeyword };

                //if search value is number then filter for ticket's id
                integerSearch = convertToNumberIfNumeric(search);
                if (typeof integerSearch === 'number') {
                    searchCondition = `(ticket.id = :integerSearch) OR ` + searchCondition;
                    params.integerSearch = integerSearch;
                }

                if (!onlyGroupingData) {
                    listQueryConditions.push(`(${searchCondition})`);
                }
                if (groupByValue) {
                    groupingQueryConditions.push(`(${searchCondition})`)
                }
                parametersArray.push(params);
            }

            //Date Filters [start date, received date, purchase date]
            applyDateFilter("ticket.startDate", taskStartFromDate, taskStartToDate);
            applyDateFilter("ticket.docReceivedDate", fromDocReceivedDate, toDocReceivedDate);
            applyDateFilter("ticket.purchaseDate", fromPurchaseDate, toPurchaseDate);

            // Assigned department filter
            if (departmentIds?.length) {
                departmentArr = validateFilterIds(departmentIds);
                const departmentCondition = `(ticket.assignedToDeptId IN (:...departmentArr))`

                if (!onlyGroupingData) {
                    listQueryConditions.push(departmentCondition);
                }
                if (groupByValue) {
                    groupingQueryConditions.push(departmentCondition)
                }
                parametersArray.push({ departmentArr: departmentArr })
            }

            // Tag filter
            if (tagIds?.length) {
                const tagCondition = `(ticketTag.tagId IN (:...tagIds))`

                if (!onlyGroupingData) {
                    listQueryConditions.push(tagCondition)
                }
                if (groupByValue) {
                    groupingQueryConditions.push(tagCondition)
                }
                parametersArray.push({ tagIds: tagIds })
            }

            //status filter
            if (statusIds?.length) {
                statusCondition = `(ticket.ticketStatusId IN (:...statusIds))`

                if (!onlyGroupingData) {
                    listQueryConditions.push(statusCondition)
                }

                //note : don't filter out status wise for grouping data if 'group by status' is applied
                if (groupByValue !== TaskGroupByEnum.STATUS) {
                    groupingQueryConditions.push(statusCondition)
                }
                parametersArray.push({ statusIds: statusIds })
            }

            //priority filter
            if (priorityIds) {
                if (priorityIds === 'null') {
                    priorityCondition = `(ticket.priorityId IS NULL)`;
                    listQueryConditions.push(priorityCondition)

                    //filter out priority wise data for 'group by priority' is not applied
                    if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                        groupingQueryConditions.push(priorityCondition)
                    }
                } else if (priorityIds?.length) {
                    const { isNullExists, uniqueIds } = validateFilterIdsWithNull(priorityIds);
                    if (uniqueIds.length) {
                        if (!isNullExists) {
                            priorityCondition = `(ticket.priorityId IN (:...priorityArr))`;
                        } else {
                            priorityCondition = `(ticket.priorityId IN (:...priorityArr) OR ticket.priorityId IS NULL)`;
                        }

                        if (!onlyGroupingData) {
                            listQueryConditions.push(priorityCondition)
                        }

                        //note : don't filter out priority wise for grouping data if 'group by priority' is applied
                        if (groupByValue !== TaskGroupByEnum.PRIORITY) {
                            groupingQueryConditions.push(priorityCondition)
                        }
                        parametersArray.push({ priorityArr: uniqueIds })
                    }
                }
            }

            // Either 'Assigned users' OR 'Me Mode' filter
            if (isMeMode) {
                const meMOdeCondition = `(ticketAssignedUser.userId = :loggedInUser)`;
                if (!onlyGroupingData) {
                    listQueryConditions.push(meMOdeCondition)
                }
                if (groupByValue) {
                    groupingQueryConditions.push(meMOdeCondition)
                }
                parametersArray.push({ loggedInUser: userId })
            } else if (assignedUserIds?.length) {
                assignedUsersArr = validateFilterIds(assignedUserIds);

                if (assignedUsersArr.length) {
                    const assigneeCondition = `(ticketAssignedUser.userId IN (:...assignedUsersArr))`
                    if (!onlyGroupingData) {
                        listQueryConditions.push(assigneeCondition)
                    }
                    if (groupByValue) {
                        groupingQueryConditions.push(assigneeCondition)
                    }
                    parametersArray.push({ assignedUsersArr: assignedUsersArr })
                }
            }

            if (!onlyGroupingData) {
                //pagination
                if (take && skip !== null) {
                    listQuery.take(take).skip(take * skip)
                }

                applyOrdering(listQuery, orderBy ?? TicketOrderByEnum.ID, orderDir ?? OrderDir.DESC);
                listQuery.addOrderBy('ticketAssignedUser.id', 'DESC')
                    .addOrderBy('ticketTag.id', 'DESC')

                //apply filter conditions
                listQueryConditions.forEach(condition => {
                    listQuery.andWhere(condition);
                });
                if (parametersArray.length) {
                    listQuery.setParameters(Object.assign({}, ...parametersArray))
                }
                [ticketsData, totalTickets] = await listQuery.getManyAndCount();

                // manipulate response for grouping data
                if (groupByValue) {
                    let groupedTickets;

                    if (groupByValue === TaskGroupByEnum.PRIORITY) {
                        groupedTickets = ticketsData.reduce((acc, ticket) => {
                            const priorityName = ticket?.priority?.name || GeneralConst.groupByNoPriority;
                            (acc[priorityName] ||= []).push(ticket);
                            return acc;
                        }, {});

                    } else {
                        groupedTickets = ticketsData.reduce((acc, ticket) => {
                            const statusName = ticket?.ticketStatus?.internalStatusName;
                            (acc[statusName] ||= []).push(ticket);
                            return acc;
                        }, {});
                    }
                    ticketsData = groupedTickets;
                }
            }
            if (filterDto) {
                // Apply the same filters to the groupByDataQuery if group by applied 
                if (groupByValue) {
                    const groupByDataQuery = this.manager.createQueryBuilder(Tickets, 'ticket')
                        .leftJoin("ticket.ticketStatus", "ticketStatus",
                            "ticket.ticketStatusId = ticketStatus.id")
                        .select("ticket.ticketStatusId as id, ticketStatus.slug as slug")
                        .where(mainTicketCondition)

                    if (groupByValue === TaskGroupByEnum.STATUS) {

                        // For status-wise grouped ticket counts
                        groupByDataQuery.select("ticket.ticketStatusId as id, ticketStatus.internalStatusName as name, ticketStatus.order as order")
                            .groupBy("ticket.ticketStatusId, ticketStatus.id, ticketStatus.order")
                            .orderBy('ticketStatus.order', 'ASC')

                    } else if (groupByValue === TaskGroupByEnum.PRIORITY) {
                        // For priority-wise grouped ticket counts
                        groupByDataQuery.leftJoin("ticket.priority", "priority", "ticket.priorityId = priority.id")
                            .select("ticket.priorityId as id, priority.name as name, priority.order as order, priority.colorCode as colorCode")
                            .groupBy("ticket.priorityId, priority.name, priority.order, priority.colorCode")
                            .orderBy('priority.order', 'ASC')
                    }

                    //search filter
                    if (search) {
                        groupByDataQuery.leftJoin("ticket.customer", "customer", "customer.id = ticket.customerId")
                            .leftJoin("ticket.vinInfo", "vinInfo", "vinInfo.id = ticket.vinId")
                            .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                            .leftJoin("buyerInfo.county", "county")
                            .leftJoin("county.state", "state")
                    }
                    //tag filter
                    if (tagArr.length) {
                        groupByDataQuery.leftJoin("ticket.ticketTag", "ticketTag", "ticketTag.ticketId = ticket.id")
                    }
                    //Either Assigned users filter OR Me Mode
                    if (assignedUsersArr.length || isMeMode) {
                        groupByDataQuery.leftJoin("ticket.ticketAssignedUser", "ticketAssignedUser",
                            "ticketAssignedUser.ticketId = ticket.id")
                    }
                    /* if (taskStartFromDate && taskStartToDate) {
                        groupByDataQuery.addSelect("ticket.startDate")
                    }
                    if (toPurchaseDate && fromPurchaseDate) {
                        groupByDataQuery.addSelect("ticket.purchaseDate")
                    }
                    if (toDocReceivedDate && fromDocReceivedDate) {
                        groupByDataQuery.addSelect("ticket.docReceivedDate")
                    } */
                    //apply filter conditions
                    groupingQueryConditions.forEach(condition => {
                        groupByDataQuery.andWhere(condition);
                    });

                    /* We don't need to apply groupBy specific filtration in the group query
                     as we need all priority/status tickets count for grouping data query */
                    if (parametersArray.length) {
                        const key = groupByValue === TaskGroupByEnum.PRIORITY ? 'priorityArr' : 'statusArr';
                        const flattenedParams = Object.assign({}, ...parametersArray.filter(param => !(key in param)));
                        groupByDataQuery.setParameters(flattenedParams);
                    }

                    const groupingData = await groupByDataQuery.addSelect("COUNT(DISTINCT ticket.id) as count")
                        .getRawMany();

                    if (groupByValue === TaskGroupByEnum.PRIORITY && groupingData.length > 0) {
                        const nullIndex = groupingData.findIndex(e => e.id === null);

                        //If non-priority data found then set name & shift position to the end
                        if (nullIndex !== -1) {
                            groupingData[nullIndex].name = GeneralConst.groupByNoPriority;
                            const [nullItem] = groupingData.splice(nullIndex, 1);
                            groupingData.push(nullItem);
                        }
                    }

                    filterDto.groupingData = groupingData; //grouped data
                }

                filterDto.count = totalTickets; //count of total tickets
            }

            return {
                tickets: ticketsData,
                page: filterDto
            };
        } catch (error) {
            throwException(error);
        }
    }

    async finishTicket(dto, user) {
        try {
            const ticket = await checkTicketExists(dto.ticketId);
            const readyForBatchPrepStatus = await TicketStatuses.findOne({ where: { slug: SlugConstants.ticketStatusReadyForBatchPrep }, select: ["id"] });

            if (!readyForBatchPrepStatus) {
                throw new NotFoundException("ERR_TICKET_STATUS_NOT_FOUND");
            }

            ticket.ticketStatusId = readyForBatchPrepStatus.id;
            ticket.sentToBatchPrep = new Date();
            ticket.sentToBatchPrepBy = user.id;
            await ticket.save();

        } catch (error) {
            throwException(error)
        }
    }

    async generateReturnLabel() {
        try {
            const token = await this.getFedExOAuthToken();
            if (!token) {
                throw new ConflictException("ERROR_MESSAGE&&&fed-ex-O-auth")
            }
            const apiUrl = `${this.configService.get("fed_ex.host")}/ship/v1/shipments`;
            const [fedExConfig] = await FedExConfig.find({ select: ["returnShipper", "returnRecipient"] });
            const shipmentData = fedExShipmentJson({ accountNumber: this.configService.get("fed_ex.account_number"), ...fedExConfig });
            const response = await axios.post(apiUrl, shipmentData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const shipment = response.data.output.transactionShipments[0];
            const labelUrl = shipment.pieceResponses[0].packageDocuments[0].url;

            if (labelUrl) {
                return {
                    serviceType: shipment.serviceType,
                    shipDate: shipment.shipDatestamp,
                    trackingNumber: shipment.masterTrackingNumber,
                    label: await axios.get(labelUrl, { responseType: 'stream' })
                };
            } else {
                throw new ConflictException("ERROR_MESSAGE")
            }
        } catch (error: any) {
            if (error?.response) {
                throw new BadRequestException(`ERROR_MESSAGE&&&&&&${error?.response?.data?.errors.map(v => v.message).join(" | ")}`)
            }
            throwException(error)
        }
    }

    async getFedExOAuthToken() {
        try {
            if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
                return this.cachedToken.token;
            }
            const response = await axios.post(`${this.configService.get("fed_ex.host")}/oauth/token`, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.configService.get("fed_ex.client_id"),
                client_secret: this.configService.get("fed_ex.client_secret")
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const expiresIn = response.data.expires_in * 1000;
            this.cachedToken = {
                token: response.data.access_token,
                expiresAt: Date.now() + expiresIn - 5000
            };

            return this.cachedToken.token;
        } catch (error) {
            throwException(error)
        }
    }

    async getFuzzyTicketList(query: GlobalSearchPageQueryDto, userId): Promise<any> {
        try {
            const listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.customer", "customer")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoin("basicInfo.transactionType", "transactionType") // Change to leftJoin for efficiency
                .leftJoin("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted = false")
                .leftJoin("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                .leftJoin("ticket.batchPrepMapping", "batchPrepMapping")
                .leftJoin("batchPrepMapping.batch", "batch")
                .leftJoin("batch.fedExDocuments", "batchWiseFedEx")
                .leftJoin("ticket.fedExDocuments", "fedExDocuments")
                .select([
                    "ticket.id", "ticket.isActive", "ticket.invoiceId",
                    "sellerInfo.name", "vinInfo.vinNumber",
                    "customer.name", "customer.email",
                    "transactionType.name", "transactionType.transactionCode",
                    "buyerInfo.isOwner", "buyerInfo.name",
                    "batchPrepMapping.batchId",
                    "fedExDocuments.trackingNumber",
                    "batchWiseFedEx.trackingNumber"
                ])
                .where("ticket.isDeleted = false")
                .andWhere("ticket.isActive = true");

            // Apply search filter
            if (query.search) {
                const search = `%${query.search}%`;
                const exactSearch = `%${query.search.toLowerCase()}%`;

                listQuery.andWhere(new Brackets(qb => {
                    qb.where(`vinInfo.vinNumber ILIKE :exactSearch OR
                              ticket.invoiceId ILIKE :exactSearch OR
                              transactionType.name ILIKE :search OR
                              customer.name ILIKE :search OR
                              sellerInfo.name ILIKE :search OR
                              fedExDocuments.trackingNumber ILIKE :search OR
                              batchWiseFedEx.trackingNumber ILIKE :search
                              `,
                        { search, exactSearch });

                        if (!isNaN(Number(query.search))) {
                            const exactId = query.search; // Use the raw search string to avoid numeric overflow
                            qb.orWhere("CAST(ticket.id AS TEXT) = :exactId", { exactId });
                            qb.orWhere("CAST(batchPrepMapping.batchId AS TEXT) = :exactId", { exactId });
                        }
                }));
            }

            // Apply date filter
            if (query.fromDate && query.toDate) {
                listQuery.andWhere("ticket.createdAt BETWEEN :fromDate AND :toDate", {
                    fromDate: query.fromDate,
                    toDate: query.toDate,
                });
            }

            // Set ordering and pagination
            const offset = query.offset * query.limit;
            listQuery
                .skip(offset) // Use skip instead of offset for better readability
                .take(query.limit) // Use take instead of limit
                .orderBy(`ticket.${query.orderBy || 'createdAt'}`, query.orderDir || 'DESC');

            // Get data
            const [tickets, count] = await listQuery.getManyAndCount();

            return {
                tickets,
                page: {
                    offset: query.offset,
                    limit: query.limit,
                    count,
                },
            };
        } catch (error) {
            throwException(error);
        }
    }
    
    async getHistory(ticketId: number): Promise<Tickets> {
        try {
            return await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.createdByUser", "ticketCreatedByUser")
                .leftJoinAndSelect("ticket.registrationInfo", "registrationInfo")
                .leftJoinAndSelect("registrationInfo.plate", "plate")
                .leftJoinAndSelect("ticket.batchPrepMapping", "batchPrepMapping")
                .leftJoinAndSelect("batchPrepMapping.batch", "batch")
                .leftJoinAndSelect("ticket.fedExDocuments", "fd")
                .select([
                    "ticket.id", "ticket.invoiceId", "ticket.createdAt", "ticket.createdBy", "ticket.sentToDmvAt",
                    "ticket.sentToBatchPrep" /* Data entry completion date */,
                    "ticketCreatedByUser.firstName", "ticketCreatedByUser.lastName",
                    "registrationInfo.id", "registrationInfo.expirationDate",
                    "plate.plateDetails",
                    "batchPrepMapping.id",
                    "batch.id", "batch.createdAt",
                    "fd.id", "fd.trackingNumber", "fd.isReturnLabel"
                ])
                .where("(ticket.id = :ticketId)", { ticketId })
                .getOne();

        } catch (error) {
            throwException(error);
        }
    }

}


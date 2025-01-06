import moment from 'moment';
import { TicketAssignedUsers } from "../entity/ticket-assigned-users.entity";
import { Tickets } from "../entity/tickets.entity";
import { User } from "../entity/user.entity";
import { DataSource, ILike, In } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Tags } from '../entity/tags.entity';
import { CarrierTypes } from '../entity/carrier-types.entity';
import { TicketStatuses } from '../entity/ticket-statuses.entity';
import { Departments } from '../entity/departments.entity';
import { Customers } from '../entity/customers.entity';
import { PriorityTypes } from '../entity/priority-types.entity';
import { TicketTags } from '../entity/ticket-tags.entity';
import { TidTypes } from '../entity/tid-types.entity';
import { TransactionTypes } from '../entity/transaction-types.entity';
import { CustomerTransactionTypes } from '../entity/customer-transaction-types.entity';
import { CustomerContacts } from '../entity/customer-contacts.entity';
import { BasicInfo } from '../entity/basic-info.entity';
import { UserDepartments } from '../entity/user-departments.entity';
import { TradeInInfo } from '../entity/trade-in-info.entity';
import { ActivityLogs } from '../entity/activity-logs.entity';
import { SellerInfo } from '../entity/seller-info.entity';
import { BuyerInfo } from '../entity/buyer-info.entity';
import { TitleStates } from '../entity/title-states.entity';
import { FmvPdfData } from '../entity/fmv-pdf-data.entity';
import { InsuranceType } from '../enums/insurance-info.enum';
import { OdometerCodeEnum } from '../enums/trade-in-info.enum';
import { ActiveDutyMilEnum, BusinessTypeEnum, IDOptionEnum } from '../enums/buyer-info.enum';
import { PlateMaster } from '../entity/plate-master.entity';
import { TicketDocuments } from '../entity/ticket-documents.entity';
import { TitleCounties } from '../entity/title-counties.entity';
import { highwayImpact100, highwayImpact50, hireAndNotForHire } from 'src/config/common.config';
import { VehicleUsageType } from '../enums/vehicle-usage-type';
import { ColorMaster } from '../entity/color-master.entity';
import { CountyContacts } from '../entity/county-contacts.entity';
import { CountyCheatSheet } from '../entity/county-cheetsheet.entity';
import { TavtTaxableMaster } from '../entity/tavt-taxable-master.entity';
import { TavtTaxExemptionMaster } from '../entity/tavt-exemption-master.entity';
import { AddOnPrices } from '../entity/add-on-prices.entity';
import { TransactionReturnTypeEnum } from '../enums/transaction-return-type.enum';
import { BillingDepositTypesEnum } from '../enums/billing-deposit-type.enum';
import { FMVValucationMaster } from '../entity/fmv-valucation-master.entity';
import { DataEntryFormType } from '../enums/form-type.enum';
import { ActivityLogActionType } from '../enums/activity-action-type.enum';
import { IdOptions } from '../enums/lien-info.enum';
import { throwException } from './throw-exception';
import { FilterBookmarks } from '../entity/filter-bookmark.entity';
import { SellerTypeEnum } from '../enums/seller-info.enum';
import { ConfigMaster } from '../entity/config-master.entity';
import { BatchGroups } from '../entity/batch-group.entity';
import { Batches } from '../entity/batch.entity';



/* check if ticket exists */
async function checkTicketExists(ticketId: number) {
    const ticketExists = await Tickets.findOne({
        where: {
            id: ticketId,
            isDeleted: false
        }
    })
    if (!ticketExists) throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&ticketId`)
    return ticketExists;
}

async function checkBatchExists(batchIds: number[]) {
    const batches = await Batches
        .createQueryBuilder("batches")
        .leftJoinAndSelect("batches.county", "county")
        .leftJoinAndSelect("county.countyProfile", "countyProfile")
        .leftJoinAndSelect("countyProfile.fedExData", "fedExData")
        .leftJoinAndSelect("fedExData.fedexServiceMaster", "fedexServiceMaster")
        .leftJoinAndSelect("county.countyProcessing", "countyProcessing")
        .select(["batches.id", "batches.countyId", "county.name", "countyProfile.id",
            "countyProcessing.type",
            "fedExData.contactName", "fedExData.companyName", "fedExData.phone", "fedExData.location", "fedexServiceMaster"])
        .where("batches.id IN (:...batchIds)", { batchIds })
        .getMany();

    const foundBatchIds = batches.map(batch => batch.id);
    const missingBatchIds = batchIds.filter(id => !foundBatchIds.includes(id));

    if (missingBatchIds.length > 0) {
        throw new NotFoundException(`ERR_BATCH_NOT_FOUND&&&Missing IDs - ${missingBatchIds.join(', ')}`);
    }

    return batches;
}

/* check if basic info  exists */
async function checkBasicInfoExists(ticketId: number) {
    const basicInfoExists = await BasicInfo.findOne({
        where: {
            ticketId
        }
    })
    if (basicInfoExists) throw new BadRequestException(`ERR_BASIC_INFO_EXIST&&&ticketId`)
    return basicInfoExists;
}

/* check if user exists */
async function checkUserExists(userId: number) {
    const userExists = await User.findOne({
        select: ['id', 'isActive'],
        where: {
            id: userId,
        }
    })
    if (!userExists) {
        throw new NotFoundException(`ERR_USER_NOT_FOUND&&&userId`)
    }

    return userExists;
}

/* check if ticket assignee exists */
async function checkTicketAssigneeExists(ticketId: number, userId: number) {
    const assigneeExists = await TicketAssignedUsers.findOne({
        select: ['id', 'ticketId', 'userId'],
        where: {
            ticketId: ticketId,
            userId: userId
        }
    })
    if (!assigneeExists) {
        return null;
    }
    return assigneeExists;
}

/* check if ticket assignee exists */
async function checkMultipleTicketAssigneeExists(ticketIds: number[], userId: number) {
    const assignedTickets = await TicketAssignedUsers.find({
        select: ['ticketId'],
        where: {
            ticketId: In(ticketIds),
            userId: userId
        }
    })
    let unassignedTicketIds = [];
    if (!assignedTickets.length || (ticketIds.length !== assignedTickets.length)) {
        // Return ticket IDs that are not assigned to the user
        unassignedTicketIds = ticketIds.filter(ticketId => !assignedTickets.some(assignedTicket => assignedTicket.ticketId === ticketId));
    }
    return unassignedTicketIds
}

/* Check valid date received for ticket */
function checkValidDateReceived(docReceivedDate) {
    if (moment(docReceivedDate).isAfter()) {
        throw new BadRequestException("ERR_DATE_RECEIVED&&&docReceivedDate");
    }
}

/* Check valid processing date for ticket */
function checkValidProcessingDate({ purchaseDate, startDate }) {
    const daysDiff = moment(startDate).diff(moment(purchaseDate), 'days');
    if (daysDiff < 0) {
        throw new BadRequestException("ERR_DATE_DIFFERENCE&&&purchaseDate");
    }
}

/* Check ticket status exists */
async function checkTicketStatusExists(ticketStatusId: number, isActive: boolean) {

    const query = TicketStatuses.createQueryBuilder("ticketStatus")
        .select(["ticketStatus.id", "ticketStatus.internalStatusName", "ticketStatus.slug"])
        .andWhere(`(ticketStatus.isDeleted = false)`)
        .andWhere(`(ticketStatus.id = :id)`, { id: ticketStatusId })
    if (isActive) {
        query.andWhere(`(ticketStatus.isActive = true)`)
    }
    const ticketStatus = await query.getOne();
    if (!ticketStatus) {
        throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND&&&ticketStatusId`);
    }
    return ticketStatus;
}

/* Check ticket's team exists */
async function checkTicketTeamExists(teamId: number, isActive: boolean) {

    const query = Departments.createQueryBuilder("department")
        .select(["department.id", "department.name"])
        .andWhere(`(department.isDeleted = false)`)
        .andWhere(`(department.id = :id)`, { id: teamId })
    if (isActive) {
        query.andWhere(`(department.isActive = true)`)
    }
    const department = await query.getOne();
    if (!department) {
        throw new NotFoundException(`ERR_DEPARTMENT_NOT_FOUND&&&teamId`);
    }
    return department;
}

/* Check department exist*/
async function checkDepartmentExists(assignedToDeptId) {
    const department = await Departments.findOne({
        where: {
            id: assignedToDeptId,
            isActive: true,
            isDeleted: false
        }
    })
    if (!department) throw new NotFoundException(`ERR_DEPARTMENT_NOT_FOUND`)
    return department;
}

/* Check customer exists*/
async function checkCustomerExists(customerId) {
    const customer = await Customers.findOne({
        where: {
            id: customerId,
            isDeleted: false
        }
    })
    if (!customer) throw new NotFoundException(`ERR_CUSTOMER_NOT_FOUND&&&customerId`);
    return customer;
}

/* Check priority exists */
async function checkPriorityExists(priorityId) {
    const priority = await PriorityTypes.findOne({
        select: ['id', 'colorCode', 'name'],
        where: {
            id: priorityId,
            isDeleted: false,
            isActive: true
        }
    })
    if (!priority) throw new NotFoundException(`ERR_PRIORITY_NOT_FOUND&&&priorityId`)
    return priority;
}

/* Check assigned users for ticket */
async function checkCarrierTypeExists(carrierTypesId) {
    const carrierType = await CarrierTypes.findOne({
        where: {
            id: carrierTypesId,
            isActive: true
        }
    })
    if (!carrierType) throw new NotFoundException(`ERR_CARRIER_NOT_FOUND&&&carrierTypesId`);
    return carrierType;
}

/* Check assigned users for ticket */
async function checkAssignedUsersForTicket(assignedUsers) {
    const foundUsers = await User.find({
        where: {
            id: In(assignedUsers)
        }
    });
    if (foundUsers.length !== assignedUsers.length) {
        throw new NotFoundException(`ERR_ASSIGNED_USER&&&assignedUsers`);
    }
}

/* Check tags exist */
async function checkTagsExist(tagIds) {
    const tagsExist = await Tags.find({
        where: {
            id: In(tagIds),
            isActive: true
        }
    });
    if (tagsExist?.length !== tagIds?.length) {
        throw new NotFoundException(`ERR_TAGS&&&tagIds&&&ERROR_MESSAGE`);
    }
}

/* generate work order id for ticket */
async function generateInvoiceId(ticketCount: number) {
    const dateFormat = moment().format('YY');
    const invoiceId = dateFormat + String.fromCharCode(65 + moment().month()) + ticketCount.toString().padStart(5, '0');
    return invoiceId;
}

/* Check given assigned users exist for particular ticket */
async function checkTicketAssignedUsers(assignedUsers, ticketId) {
    const checkTicketUsers = await TicketAssignedUsers.find({
        where: {
            userId: In(assignedUsers),
            ticketId: ticketId,
        }
    });
    if (checkTicketUsers.length) {
        throw new NotFoundException(`ERR_TICKET_USERS_EXIST&&&assignedUsers`);
    }
}

/* get count of transaction types */
async function checkTransactionTypesCount(transactionTypesIds) {
    const checkTransactionTypes = await TransactionTypes.count({
        where: {
            id: In(transactionTypesIds),
            isDeleted: false,
            isActive: true
        }
    });
    return checkTransactionTypes;
}

/*get count of customer transaction types */
async function checkCustomerTransactionTypesCount(transactionTypesIds, customerId) {
    const checkTransactionTypes = await CustomerTransactionTypes.count({
        where: {
            id: In(transactionTypesIds),
            customerId: customerId
        }
    });
    return checkTransactionTypes;
}

/* Check given tagIds exist of a particular ticket */
async function checkTicketTags(tags, ticketId) {
    const checkTicketTagsExist = await TicketTags.findOne({
        where: {
            tagId: In(tags),
            ticketId: ticketId,
        }
    });
    if (checkTicketTagsExist) {
        throw new NotFoundException(`ERR_TICKET_TAGS_EXIST&&&assignedUsers`);
    }
}

/* Check if tag exists for given tag */
async function checkTicketTagExists(tagId, ticketId) {
    const tagsExist = await TicketTags.findOne({
        where: {
            ticketId: ticketId,
            tagId: tagId
        }
    });
    if (!tagsExist) return null;
    return tagsExist;
}

/* Check if tag already exists for given id */
async function checkTagExists(tagId: number) {
    const tagsExist = await Tags.findOne({
        where: { id: tagId }
    });
    if (!tagsExist) return null;
    return tagsExist;
}


/* Check TID type exist*/
async function checkTidTypeExists(id) {
    const getData = await TidTypes.findOne({
        where: { id: id, isDeleted: false }
    });
    if (!getData) {
        throw new NotFoundException(`ERR_TID_TYPE_NOT_FOUND`);
    }
    return getData;
}

/* Check transaction type exists*/
async function checkTransactionTypeExists(id) {
    const data = await TransactionTypes.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_TRANSACTION_TYPE_NOT_FOUND`);
    return data;
}

/* Check contact exists*/
async function checkContactExists(id) {
    const data = await CustomerContacts.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_CONTACT_NOT_FOUND`);
    return data;
}

/* Check department exists */
async function checkDepartmentDataExists(arr) {
    const departments = await Departments.find({
        where: {
            id: In(arr),
        }
    });
    if (departments.length !== arr.length) {
        throw new NotFoundException(`ERR_INVALID_DEPARTMENT`);
    }
}

/* Check given departments mapped with user */
async function checkUserAssignedDepartments(departments, userId) {
    const data = await UserDepartments.findOne({
        where: {
            departmentId: In(departments),
            userId: userId,
        }
    });
    if (data) {
        throw new NotFoundException(`ERR_USER_DEPARTMENT_EXIST&&&departments`);
    }
}

/* Check user-department exists*/
async function checkUserDepartment(departmentId, userId) {
    const data = await UserDepartments.findOne({
        where: {
            departmentId: departmentId,
            userId: userId,
        }
    });
    if (!data) {
        throw new NotFoundException(`ERR_USER_DEPARTMENT_NOT_EXIST`);
    }
    return data;
}

/* Check if customer's contact exists for primary flag*/
async function checkCusContactForPrimary(customerId) {
    const contact = await CustomerContacts.findOne({
        select: ['id', "isPrimary", "isActive"],
        where: {
            customerId: customerId,
            isPrimary: true,
            isDeleted: false
        }
    })
    if (!contact) { return null }
    return contact;
}

function formatPrice(price: string | number): string {
    if (price === '') {
        return null;
    }
    if (!price) {
        return;
    }
    const priceStr = typeof price === 'number' ? price.toString() : price;
    if (priceStr.includes('.')) {
        return priceStr;
    } else {
        return priceStr + '.00';
    }
}

/* Check trade in info exist*/
async function checkTradeInInfoExists(id) {
    const getData = await TradeInInfo.findOne({
        where: { id: id, isDeleted: false }
    });
    if (!getData) {
        throw new NotFoundException(`ERR_TRADE_IN_INFO_NOT_FOUND`);
    }
    return getData;
}

/* get priority data */
async function getPriorityData(priorityId) {
    const priority = await PriorityTypes.findOne({
        select: ['id', 'name', 'colorCode'],
        where: { id: priorityId }
    })
    if (!priority) { return null; }
    return priority;
}

/* get ticket status data */
async function getTicketStatusData(ticketStatusId) {
    const status = await TicketStatuses.findOne({
        select: ['id', 'internalStatusName'],
        where: { id: ticketStatusId }
    })
    if (!status) { return null; }
    return status;
}

/* get user */
async function getUser(userId: number) {
    const userExists = await User.findOne({
        select: ['id', 'isActive', 'email', 'firstName', 'lastName'],
        where: {
            id: userId,
        }
    })
    if (!userExists) { return null; }
    return userExists;
}

/* Check transaction type exists*/
async function checkSellerInfoExists(id) {
    const data = await SellerInfo.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_SELLER_INFO_NOT_FOUND`);
    return data;
}

async function checkBuyerInfoExists(id) {
    const data = await BuyerInfo.findOne({
        where: {
            id: +id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_BUYER_INFO_NOT_FOUND`);
    return data;
}

/* Find mentioned user and return data */
async function mentionedUserFunction(comment: string, mentions) {
    //const comment = '@1 @2 Let's go to this event.'

    /**********  Regex to find @userId  *************/
    const pattern = new RegExp(`@[0-9]{1,}`, 'g');
    let userIdArr = [];
    let finalMentions = [];
    let mainMentions = [];

    let mentionedUsers = comment.match(pattern) || [];

    if (!mentionedUsers.length) {
        return {
            mentionedUsers,
            userIdArr,
            finalMentions,
            mainMentions
        }
    }

    userIdArr = mentionedUsers.length
        ? mentionedUsers.map(element => element.substring(1)).map(e => parseInt(e))
        : [];

    /* *********** To store comment mentions ************* */
    finalMentions = mentions.map(e => +e).filter(value => userIdArr.includes(value));

    /* **************** For list activity logs *************** */

    mainMentions = finalMentions.map(e => `@${e}`);

    return { mentionedUsers, userIdArr, finalMentions, mainMentions }
}

/* Conversion of mentioned user with username in comment */
async function activityMentionConversion(element: ActivityLogs, mentions, isList: boolean) {

    const { mainMentions } = await mentionedUserFunction(element.newData, mentions);

    for (let i = 0; i < element.commentMention.length; i++) {
        const regex = new RegExp(`${mainMentions[i]}`, 'g');
        element.newData = element.newData.replace(
            regex,
            `@${element.commentMention[i].mentionedUser.firstName} ${element.commentMention[i].mentionedUser.lastName}`
        );
    }
    return element;
}

/* check if state exists */
async function checkStateExists(stateId: number) {
    const data = await TitleStates.findOne({
        select: ["id"],
        where: { id: stateId }
    })
    if (!data) throw new NotFoundException(`ERR_STATE_NOT_FOUND&&&stateId`)
    return data;
}

async function plateTypeExist(plateTypeId: number) {
    const data = await PlateMaster.findOne({
        where: { id: plateTypeId }
    })
    if (!data) throw new NotFoundException(`ERR_PLATE_MASTER_NOT_FOUND&&&plateTypeId`)
}

async function checkFmvDataExists(id) {
    const data = await FmvPdfData.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_FMV_PDF_DATA_NOT_FOUND`);
    return data;
}

async function checkFmvMasterExists(id) {
    const data = await FMVValucationMaster.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_FMV_PDF_DATA_NOT_FOUND`);
    return data;
}


async function getInsuranceTypeName(type) {
    switch (type) {
        case InsuranceType.BINDER:
            return "Binder";
        case InsuranceType.FLEET:
            return "Fleet";
        case InsuranceType.GA_INSURANCE_ON_FILE:
            return "GA Insurance on file";
        default:
            return null;
    }
}

function getOdometerCodeName(odometerCode) {
    switch (odometerCode) {
        case OdometerCodeEnum.EXCEEDS_MECH_LIM:
            return "Exceeds mechanical limits";
        case OdometerCodeEnum.ACTUAL:
            return "Actual";
        case OdometerCodeEnum.EXEMPT:
            return "Exempt";
        case OdometerCodeEnum.NOT_ACTUAL_MILAGE:
            return "Not actual milage";
        default:
            return odometerCode;
    }
}

function getBuyerType(type) {
    switch (type) {
        case BusinessTypeEnum.INDIVIDUAL:
            return "Individual";
        case BusinessTypeEnum.BUSINESS:
            return "Business";
    }
}
function getIdOption(type) {
    switch (type) {
        case IdOptions.GA_DRIVER_LICENSE:
            return "Ga driver license id";
        case IdOptions.LIST_OTHER_STATE_ID:
            return "List other states id";
        case IdOptions.OTHER_ID:
            return "Other id";
    }
}
function getActiveMil(type) {
    switch (type) {
        case ActiveDutyMilEnum.TAVT:
            return "Tavt";
        case ActiveDutyMilEnum.SALES_TAX:
            return "Sales tax";

    }
}

/* Check document exists or not */
async function checkDocumentExists(docId: number) {
    const document = await TicketDocuments.findOne({
        select: ["id", "ticketId", "fileName", "description"],
        where: { id: docId, isDeleted: false }
    });
    if (!document) {
        throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND')
    }
    return document;
}

function getExpirationDate(data) {
    const currentYear = new Date(data.startDate).getFullYear();
    const expirationData = [
        { char: ["A", "B"], month: "January", monthIndex: 0 },
        { char: ["C", "D"], month: "February", monthIndex: 1 },
        { char: ["E", "F", "4", "5", "8"], month: "March", monthIndex: 2 },
        { char: ["G", "H"], month: "April", monthIndex: 3 },
        { char: ["I", "J"], month: "May", monthIndex: 4 },
        { char: ["K", "L"], month: "June", monthIndex: 5 },
        { char: ["M", "N", "9"], month: "July", monthIndex: 6 },
        { char: ["O", "P", "1"], month: "August", monthIndex: 7 },
        { char: ["Q", "R"], month: "September", monthIndex: 8 },
        { char: ["S", "T", "2", "3", "6", "7"], month: "October", monthIndex: 9 },
        { char: ["U", "V", "W"], month: "November", monthIndex: 10 },
        { char: ["X", "Y", "Z", "0"], month: "December", monthIndex: 11 }
    ];
    const expirationDataStateBased = [
        { char: ["A", "B", "C", "D"], month: "January", monthIndex: 0 },
        { char: ["E", "F", "G", "H", "I", "J", 'K',], month: "February", monthIndex: 1 },
        { char: ["L", "M", "N", "O", "P", "Q", "R",], month: "March", monthIndex: 2 },
        { char: ["S", "T", "U", "V", "W", "X", "Y", "Z",], month: "April", monthIndex: 3 }
    ];
    const expirationLookup = (["CAL", "CLY", "STW", "TUR", "TAL"].includes(data?.buyerInfo[0]?.county?.code) ? expirationDataStateBased : expirationData).reduce((lookup, entry) => {
        entry.char.forEach(char => {
            lookup[char.toUpperCase()] = new Date(currentYear, entry.monthIndex + 1, 0).toLocaleDateString('en-CA');
        });
        return lookup;
    }, {});
    const response: any = { tavtForm: data?.tavtForm }
    if (data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS) {
        const ownerName = data?.buyerInfo[0]?.name;
        if (ownerName) {
            const firstChar = ownerName.charAt(0).toUpperCase();
            response.expirationDate = expirationLookup[firstChar];
        }
    } else if (data?.buyerInfo[0]?.dob) {
        response.expirationDate = moment(data?.buyerInfo[0]?.dob).year(moment().year()).format('YYYY-MM-DD');
    }

    if (hireAndNotForHire.includes(data?.registrationInfo?.plate?.plateTypes?.slug)) {
        response.expirationDate = moment(`${new Date().getFullYear()}-02-15`).format("YYYY-MM-DD");
    }

    let expirationDate = moment(response.expirationDate)
    expirationDate = expirationDate.isBefore(moment(data?.startDate), 'day') ? (expirationDate = expirationDate.add(1, 'year')) : expirationDate;
    const differenceInDays = expirationDate.diff(moment(data?.startDate), 'days')
    if ((data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS && differenceInDays < 90) || (data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS && differenceInDays < 30)) {
        response.isRenewalRequired = true;
        response.dayRange = data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS ? 90 : 30;
        response.dateDifference = differenceInDays;
    } else if (data.titleInfo?.titleState?.code == "MSO") {
        response.isRenewalRequired = true;
        response.dayRange = data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS ? 90 : 30;
        response.dateDifference = differenceInDays;
    } else {
        response.dateDifference = differenceInDays;
        response.dayRange = data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS ? 90 : 30;
        response.isRenewalRequired = false;
    }

    return {
        vinInfo: data?.vinInfo,
        gvw: data?.vinInfo?.gvw,
        ...response
    }
}

function initialCostCalc(data) {
    const commercialAlternativeFuelFee = data?.config?.commercialAlternativeFuelFee || 0;
    const nonCommercialAlternativeFuelFee = data?.config?.nonCommercialAlternativeFuelFee || 0;
    const initialCost: any = {
        transferFee: 5,
        totalInitialCost: 0,
    }
    const standardFee = parseFloat(data?.plate?.standardFee || "0.00");
    const manufacturingFee = parseFloat(data?.plate?.manufacturingFee || "0.00");
    const annualSpecialFee = parseFloat(data?.plate?.annualSpecialFee || "0.00");
    const currentDate = new Date(data?.ticket?.startDate);
    if (data?.plateTransfer && !data?.expirationDate) {
        initialCost.standardFee = standardFee;
    } else if (data?.plateTransfer && data?.expirationDate) {
        const expirationDate = moment(data.expirationDate);
        const previousDate = expirationDate.isBefore(moment(data?.ticket?.startDate), 'day')
        if (previousDate) {
            const penalty = standardFee * (5 / 100)
            initialCost.transferFee = 0;
            initialCost.standardFee = standardFee;
            initialCost.penalty = penalty < 5 ? 5 : penalty;  // 5% penalty logic
        } else {
            const differenceInDays = expirationDate.diff(moment(data?.ticket?.startDate), 'days')
            if ((data?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS && differenceInDays < 90) || (data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS && differenceInDays < 30)) {
                //Business Individual days logic
                initialCost.transferFee = 0;
                initialCost.standardFee = standardFee;
            } else {
                initialCost.standardFee = 0;
            }
        }

        if (["CAL", "CLY", "STW", "TUR"].includes(data?.ticket?.buyerInfo[0]?.county?.code) && data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS) {
            const start = new Date(currentDate.getFullYear(), 0, 1); // January 1 of the current year
            const end = new Date(currentDate.getFullYear(), 3, 30); // April 30 of the current year
            const isInRange = currentDate >= start && currentDate <= end;
            if (isInRange) {
                initialCost.penalty = 0;
            }
        }

        if (data?.ticket?.buyerInfo[0]?.county?.code == "TAL" && data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS) {
            const penaltyCheck = checkRegistration(data?.expirationDate, data?.ticket?.startDate);
            if (penaltyCheck) {
                const penalty = standardFee * (5 / 100)
                initialCost.penalty = penalty < 5 ? 5 : penalty;

            } else {
                initialCost.penalty = 0;
            }
        }

    } else if (!data?.plateTransfer) {
        initialCost.manufacturingFee = manufacturingFee;
        initialCost.annualSpecialFee = annualSpecialFee;
        delete initialCost.transferFee;
    }

    if (data?.isHighwayImpact50) {
        initialCost.highwayImpact50 = highwayImpact50;
    }

    if (data?.isHighwayImpact100) {
        initialCost.highwayImpact100 = highwayImpact100;
    }

    //Heavy vehicle conditions for penalty
    if (hireAndNotForHire.includes(data?.plate?.plateTypes?.slug)) {
        const expirationHeavyVehicle = moment(`${new Date().getFullYear()}-02-15`);
        const differenceInDays = expirationHeavyVehicle.diff(moment(data?.ticket?.startDate), 'days')

        if (!((data?.ticket?.buyerInfo?.[0]?.type == BusinessTypeEnum.BUSINESS && differenceInDays < 90 && differenceInDays > 0) || (data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS && differenceInDays < 30 && differenceInDays > 0))) {
            initialCost.penalty = 5;
        }
    }

    if (data?.isAlternativeFuelFee) {
        let monthlyFee = 0;
        let yearlyFee = 0;
        if (data.ticket?.vinInfo?.vehicleUse == VehicleUsageType.COMMERCIALS) {
            monthlyFee = commercialAlternativeFuelFee / 12;
            yearlyFee = commercialAlternativeFuelFee;
        } else if (data.ticket?.vinInfo?.vehicleUse == VehicleUsageType.PRIVATE) {
            monthlyFee = nonCommercialAlternativeFuelFee / 12;
            yearlyFee = nonCommercialAlternativeFuelFee;
        }
        const spentMonths = currentDate.getMonth();
        const remainingFee = yearlyFee - (monthlyFee * spentMonths);
        initialCost.alterFuelFee = parseFloat(remainingFee.toFixed(2));
    }

    if (!data?.plateTransfer && data?.isRenewTwoYears) {
        if (data?.plate?.categoryCode == "PT") {
            initialCost.standardFee = standardFee;
            initialCost.manufacturingFee = manufacturingFee;
            initialCost.annualSpecialFee = annualSpecialFee;
            initialCost.highwayImpact50 = initialCost?.highwayImpact50 && initialCost?.highwayImpact50 * 1;
            initialCost.highwayImpact100 = initialCost?.highwayImpact100 && initialCost?.highwayImpact100 * 1;
        } else {
            initialCost.standardFee = standardFee * 2;
            initialCost.manufacturingFee = manufacturingFee;
            initialCost.annualSpecialFee = annualSpecialFee * 2;
            initialCost.highwayImpact50 = initialCost?.highwayImpact50 && initialCost?.highwayImpact50 * 2;
            initialCost.highwayImpact100 = initialCost?.highwayImpact100 && initialCost?.highwayImpact100 * 2;
        }
        const effectiveFrom = moment(data?.ticket?.startDate);
        initialCost.renewal = {
            effectiveFrom: {
                year: effectiveFrom.format('MMM YYYY'),
                standardFee: standardFee,
                penalty: initialCost.penalty,
                manufacturingFee: manufacturingFee,
                annualSpecialFee: annualSpecialFee,
                highwayImpact50: initialCost?.highwayImpact50 && initialCost.highwayImpact50 / 2,
                highwayImpact100: initialCost?.highwayImpact100 && initialCost.highwayImpact100 / 2
            },
            effectiveTo: {
                standardFee: standardFee,
                annualSpecialFee: annualSpecialFee,
                highwayImpact50: initialCost?.highwayImpact50 && initialCost.highwayImpact50 / 2,
                highwayImpact100: initialCost?.highwayImpact100 && initialCost.highwayImpact100 / 2
            }
        }

        if (data?.isAlternativeFuelFee) {
            if (data.ticket?.vinInfo?.vehicleUse == VehicleUsageType.COMMERCIALS) {
                initialCost.renewal.effectiveFrom.alterFuelFee = initialCost.alterFuelFee;
                initialCost.renewal.effectiveTo.alterFuelFee = commercialAlternativeFuelFee;
                initialCost.alterFuelFee = initialCost.alterFuelFee + commercialAlternativeFuelFee;
            } else if (data.ticket?.vinInfo?.vehicleUse == VehicleUsageType.PRIVATE) {
                initialCost.renewal.effectiveFrom.alterFuelFee = initialCost.alterFuelFee;
                initialCost.renewal.effectiveTo.alterFuelFee = nonCommercialAlternativeFuelFee;
                initialCost.alterFuelFee = initialCost.alterFuelFee + nonCommercialAlternativeFuelFee;
            }
        } else {
            initialCost.alterFuelFee = undefined
        }

        let expirationDate = moment(getExpirationDate(data.ticket)?.expirationDate);

        if (expirationDate.isBefore(moment(data?.ticket?.startDate), 'day')) {
            expirationDate = expirationDate.add(1, 'year');
        }

        if (data?.plate?.categoryCode == "PT") {
            initialCost.renewal.effectiveTo = {}
        }

        const differenceInDays = expirationDate.diff(moment(data?.ticket?.startDate), 'days')

        if ((data?.ticket?.buyerInfo[0]?.type == BusinessTypeEnum.BUSINESS && differenceInDays < 90) || (data?.buyerInfo?.[0]?.type != BusinessTypeEnum.BUSINESS && differenceInDays < 30)) {
            initialCost.renewal.effectiveTo.year = moment(expirationDate).add(1, 'year').format('MMM YYYY');
        } else if (data.ticket.titleInfo?.titleState?.code == "MSO") {
            initialCost.renewal.effectiveFrom.year = expirationDate.format('MMM YYYY');
            initialCost.renewal.effectiveTo.year = moment(expirationDate).add(1, 'year').format('MMM YYYY');
        }
    }

    if (!data?.plateTransfer) {
        if (data?.isRenewTwoYears) {
            if (data?.plate?.isRegQuarter && data?.plate?.quarterCalc) {
                const quarterSF = data?.plate?.quarterCalc[getQuarter(currentDate)] || standardFee
                initialCost.standardFee = standardFee
                initialCost.standardFee += quarterSF;
                initialCost.renewal.effectiveFrom.standardFee = quarterSF
                initialCost.renewal.effectiveTo.standardFee = standardFee
            }
        } else if (data?.plate?.isRegQuarter && data?.plate?.quarterCalc) {
            initialCost.standardFee = data?.plate?.quarterCalc[getQuarter(currentDate)] || standardFee;
        } else {
            initialCost.standardFee = standardFee;
        }
    }

    const totalCost: any = Object.values(initialCost).filter(value => typeof value === 'number').reduce((acc: any, value: any) => acc + value, 0);
    initialCost.totalInitialCost = parseFloat(totalCost.toFixed(2));
    return initialCost;
}

/* check if county exists */
async function checkCountyExists(county: number) {
    if (county === null) {
        return null;
    }
    const countyExists = await TitleCounties.findOne({
        select: ['id', 'name', 'code', 'countyCode'],
        where: {
            id: county,
            isDeleted: false
        }
    })
    if (!countyExists) throw new NotFoundException(`ERR_COUNTY_NOT_FOUND&&&county`)
    return countyExists;
}

function checkRegistration(expirationDate, startDate) {
    const dob: any = new Date(expirationDate);
    if (isNaN(dob)) {
        throw new Error("ERR_DOB");
    }
    const birthMonth = dob.getMonth() + 1;
    const registrationMonths = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
    const registrationMonth = registrationMonths[birthMonth - 1];
    const currentMonth = new Date(startDate).getMonth() + 1;
    return currentMonth !== registrationMonth;
}

/* Check color exist*/
async function checkColorExists(id, isPrimary) {
    const color = await ColorMaster.findOne({
        where: { id: id }
    })
    if (!color) {
        const msg = isPrimary ? "ERR_PRIMARY_COLOR_NOT_FOUND" : "ERR_SECONDARY_COLOR_NOT_FOUND";
        throw new NotFoundException(msg)
    }
    return color;
}

function getQuarter(date) {
    const month = date.getMonth() + 1;

    if (month === 12 || month <= 2) {
        return 'quarter1'; // 1st Dec to 29th Feb
    } else if (month >= 3 && month <= 5) {
        return 'quarter2'; // 1st Mar to 31st May
    } else if (month >= 6 && month <= 8) {
        return 'quarter3'; // 1st Jun to 30th Aug
    } else if (month >= 9 && month <= 11) {
        return 'quarter4'; // 1st Sep to 30th Nov
    } else {
        return '';
    }
}

async function checkCountyContactExists(id) {
    const data = await CountyContacts.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) throw new NotFoundException(`ERR_CONTACT_NOT_FOUND`);
    return data;
}

/* Check if county's contact exists for primary flag*/
async function checkCountyContactForPrimary(countyId) {
    const contact = await CountyContacts.findOne({
        select: ['id', "isPrimary", "isActive"],
        where: {
            countyId,
            isPrimary: true,
            isDeleted: false
        }
    })
    if (!contact) { return null }
    return contact;
}

function filterYearlyGraph(graphData) {
    const months = [
        { name: "Jan", count: 0 },
        { name: "Feb", count: 0 },
        { name: "Mar", count: 0 },
        { name: "Apr", count: 0 },
        { name: "May", count: 0 },
        { name: "Jun", count: 0 },
        { name: "Jul", count: 0 },
        { name: "Aug", count: 0 },
        { name: "Sep", count: 0 },
        { name: "Oct", count: 0 },
        { name: "Nov", count: 0 },
        { name: "Dec", count: 0 }
    ];

    graphData.forEach(data => {
        months[data.month - 1].count = parseInt(data.count);
    });

    return months;
}

async function checkCheatSheetExists(id) {
    const data = await CountyCheatSheet.findOne({
        where: {
            countyId: id,
            isDeleted: false
        }
    });
    return {
        exists: !!data,
        data: data
    }; // Return true if data exists, false otherwise
}

//only want tto check if ticket exists. not required all ticket details
async function findTicket(id: number) {
    if (isNaN(id)) {
        return null;
    }
    const data = await Tickets.findOne({
        select: ['id'],
        where: {
            id: id,
            isDeleted: false
        }
    })
    if (!data) { throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&ticketId`) }
    return data;
}

async function checkTaxAbleMasterExists(id) {
    const data = await TavtTaxableMaster.findOne({
        where: {
            id: id,
            isDeleted: false
        }
    });
    if (!data) throw new NotFoundException(`ERR_TAX_ABLE_MASTER_FOUND`);
    return data;
}

async function checkTaxExemptionMasterExists(id) {
    const data = await TavtTaxExemptionMaster.findOne({
        select: ['id', 'isActive', 'isDeleted'],
        where: {
            id: id,
            isDeleted: false
        }
    });
    if (!data) throw new NotFoundException(`ERR_TAX_EXEMPTION_MASTER_NOT_FOUND`);
    return data;
}

async function getCustomerAddress(ticketId: number) {
    const data = await Tickets.createQueryBuilder("ticket")
        .leftJoinAndSelect("ticket.customer", "customer")
        .select(["ticket.id", "ticket.customerId", "customer.id", "customer.primaryLocation"])
        .where(`(ticket.id = :ticketId)`, { ticketId })
        .getOne();
    if (!data) { return null; }
    return data?.customer?.primaryLocation || null;
}

async function getExpressMailFees() {
    const data = await AddOnPrices.findOne({
        select: ['price'],
        where: {
            code: 'EXPM', isDeleted: false, isActive: true
        }
    })
    if (!data) { return "0" }
    return `${data?.price}`;
}

async function getTransactionReturnType(type) {
    switch (type) {
        case TransactionReturnTypeEnum.CUS_PROVIDED_LABEL_BACK_TO_THEM:
            return "Customer provided label back to them ";
        case TransactionReturnTypeEnum.CUS_PROVIDED_LABEL_TO_CLIENT:
            return "Customer provided label to their Client ";
        case TransactionReturnTypeEnum.CUS_WILL_PICKUP:
            return " Customer will pickup";
        case TransactionReturnTypeEnum.SHIP_BACK_TO_CUS_AND_CHARGE_FEE:
            return "Ship back to Customer + Charge Fee";
        case TransactionReturnTypeEnum.SHIP_BACK_TO_CUS_AND_REQ_LABEL:
            return "Ship back to Customer - Request Label";
        case TransactionReturnTypeEnum.SHIP_TO_CLIENT_OR_ENTER_ADDRESS_AND_CHARGE_FEE:
            return "Ship to Client/Enter address information + Charge Fee";
        case TransactionReturnTypeEnum.COUNTY_MAILED_REG_OR_PLATE_TO_DRIVER:
            return "County mailed Reg/Plate to Driver";
        case TransactionReturnTypeEnum.DRIVER_PICKED_UP_REG_OR_PLATE_AT_COUNTY_AND_NO_FEE:
            return "Driver picked up Reg/Plate at County - No Fee";
        default:
            return null;
    }
}

async function getBillingDepositType(type) {
    switch (type) {
        case BillingDepositTypesEnum.US:
            return "Deposit to Us";
        case BillingDepositTypesEnum.COUNTY:
            return "Deposit to County";
        default:
            return null;
    }
}

function getIdOptionValue(type) {
    switch (type) {
        case IDOptionEnum.GA_DRIVER_LIC:
            return "Ga driver license id";
        case IDOptionEnum.LIST_OTHER_STATES_ID:
            return "List other states id";
        case IDOptionEnum.OTHER_ID:
            return "Other id";
    }
}

/* find billing info started log*/
async function findBillingInfoStartedLog(ticketId: number,) {
    const logExists = await ActivityLogs.findOne({
        select: ['id', 'ticketId', 'formType', 'actionType'],
        where: {
            ticketId: ticketId,
            formType: In([DataEntryFormType.BILLING_INFO_ACTIVITY, DataEntryFormType.SUMMARY_BILLING_INFO_ACTIVITY]),
            actionType: ActivityLogActionType.FORM_START
        }
    })
    if (!logExists) { return null; }
    return logExists;
}

async function commonDeleteHandler(dataSource: DataSource, entity, deleteData, userId, successMessage, notFoundMessage) {
    try {
        const { ids } = deleteData;

        const existingRecordsCount = await entity.count({
            where: { id: In(ids), isDeleted: false },
        });

        if (existingRecordsCount !== ids.length) {
            return {
                message: notFoundMessage,
                data: {},
            };
        }
        // Proceed with deletion if all IDs are found
        await dataSource.transaction(async transactionalEntityManager => {
            await transactionalEntityManager
                .createQueryBuilder()
                .update(entity)
                .set({ isDeleted: true, updatedBy: userId })
                .whereInIds(ids)
                .execute();
        });

        return {
            message: successMessage,
            data: {}
        };
    } catch (error) {
        throwException(error);
    }
}

function getValue(value: any): string {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return '';
    }
    return value.toString();
}


//Find tickets by given ticket ids
function findTicketsByTicketIds(ticketIds: number[]): Promise<number> {
    const ticketsCount = Tickets.createQueryBuilder("ticket")
        .where("ticket.id IN (:...ticketIds) AND ticket.isDeleted = false", { ticketIds })
        .getCount();
    return ticketsCount;
}

//get user ids for emitting 
async function getAllUserIds() {
    const users: any = await User.find({
        select: ['id'],
        where: {
            isDeleted: false,
            isActive: true
        }
    })
    const userIds: any = users?.map(e => e.id) || [];
    return userIds;
}


//get total tickets count
async function getTotalTicketCount() {
    return await Tickets.count({
        where: {
            isDeleted: false,
            isActive: true
        }
    })
}

//convert input into a number
function convertToNumberIfNumeric(value) {
    // Check if the value is a numeric string
    if (!isNaN(value)) {
        return Number(value); // Convert the string to a number
    }
    return value;
}

//check bookmark filter exists or not
async function checkFilterBookmarkExists(id: number) {
    const data = await FilterBookmarks.findOne({
        select: ['id'],
        where: { id }
    })
    if (!data) {
        throw new NotFoundException(`ERR_BOOKMARK_NOT_FOUND&&&id&&&ERROR_MESSAGE`)
    }
}

// get team specific unique users 
async function getTeamSpecificUsers(teamIds: number[]) {
    const data = await UserDepartments.createQueryBuilder("userDepartment")
        .select("DISTINCT userDepartment.userId AS user_id")
        .where(`userDepartment.departmentId IN (:...teamIds)`, { teamIds })
        .getRawMany();
    if (!data.length) {
        return [];
    }
    return data.map(elem => elem.user_id);
}

// get user's assigned departments
async function getUserSpecificTeams(userId: number) {
    const data = await UserDepartments.createQueryBuilder("userDepartment")
        .leftJoin("userDepartment.department", "department")
        .select(["userDepartment.departmentId"])
        .where(`userDepartment.userId = :userId`, { userId })
        .andWhere(`department.isDeleted = false AND department.isActive = true`)
        .getMany();
    if (!data) {
        return [];
    }
    return data.map(elem => elem.departmentId)
}


//get ticket's status based on given slug
async function getStatusFromSlug(slug: string) {
    const data = await TicketStatuses.findOne({
        select: ['id', 'internalStatusName'],
        where: { slug }
    })
    if (!data) {
        return null;
    }
    return data
}

/* Get count of ticket's fields which has null value */
async function checkTicketNullValues(ticket, statusSlug?: string | null) {
    const fieldNameMapping = {
        trackingId: "TRACKING ID",
        customerId: "CUSTOMER",
        ticketStatusId: "STATUS",
        carrierTypesId: "CARRIER",
        assignedToDeptId: "ASSIGN TEAM",
        tidTypeId: "TID TYPE"
    };

    const fieldsToCheck = [
        "customerId", "ticketStatusId", "carrierTypesId", "assignedToDeptId", "tidTypeId", "trackingId"
    ];
    const nullFields = fieldsToCheck.filter(field => ticket[field] === null).map(field => fieldNameMapping[field]);

    return {
        nullCount: nullFields.length,
        nullFields,
        statusSlug
    };
}

function getSellerType(type) {
    switch (type) {
        case SellerTypeEnum.BIZ_IND_NON_DEL:
            return "Business individual non dealer";
        case SellerTypeEnum.GADEALER:
            return "GA dealer";
        case SellerTypeEnum.BIZ_NON_DEALER:
            return "Business non dealer";
        case SellerTypeEnum.GOV:
            return "Government";
        case SellerTypeEnum.IND_NON_DEALER:
            return "Individual non dealer";
        case SellerTypeEnum.OUT_OF_STATE_DEALER:
            return "Out of state dealer";
        case SellerTypeEnum.OUT_OF_STATE_TRANSFER:
            return "Out of state transfer";
        default:
            return type;
    }
}

async function getConfigVariables(variableNames: string[]) {
    const configs = await ConfigMaster.find({ where: { variableName: In(variableNames) } });
    const result = configs.reduce((acc, item: any) => {
        acc[item.variableName] = parseFloat(item.value); // convert value to float
        return acc;
    }, {});
    return result
}
async function getProcessingDate() {
    const currentDate = new Date();
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    // Monday if next day Saturday/Sunday
    if (nextDay.getDay() === 6) {
        nextDay.setDate(nextDay.getDate() + 2);
    } else if (nextDay.getDay() === 0) {
        nextDay.setDate(nextDay.getDate() + 1);
    }
    return moment(nextDay).format('MM/DD/YYYY');;
}

async function checkValidSeller(entity, dataSource: DataSource, name: string, address: string, id?: number, ticketId?: any) {
    const repository = dataSource.getRepository(entity);
    const query = repository.createQueryBuilder("seller")
        .select(["seller.address", "seller.name"])
        .where("LOWER(seller.name) = LOWER(:name)", { name })
        .andWhere("LOWER(seller.address) = LOWER(:address)", { address })
        .andWhere("seller.isDeleted = false");

    if (id) {
        query.andWhere("seller.id != :id", { id });
    }
    if (ticketId) {
        query.andWhere("seller.ticketId = :ticketId", { ticketId });
    }

    const checkDuplicateSeller = await query.getOne();
    if (checkDuplicateSeller) {
        throw new ConflictException("ERR_SELLER_EXIST");
    }
}

//check batch group exists
async function checkBatchGroupExists(groupId: number) {
    const data = await BatchGroups.createQueryBuilder("batchGroup")
        .leftJoinAndSelect("batchGroup.documents", "document", "document.isDeleted = false")
        .leftJoinAndSelect("batchGroup.groupBatch", "groupBatch")
        .leftJoinAndSelect("groupBatch.county", "county")
        .leftJoin("county.countyProcessing", "countyProcessing")
        .select([
            "batchGroup.id",
            "document.id",
            "document.fileName",
            "groupBatch.id",
            "groupBatch.countyId",
            "county.id",
            "countyProcessing.type"
        ])
        .where("batchGroup.id = :groupId", { groupId })
        .getOne();

    if (!data) {
        throw new NotFoundException(`ERR_BATCH_GROUP_NOT_FOUND&&&groupId&&&ERROR_MESSAGE`);
    }

    return data;
}

function fedExShipmentJson(payload, isReturn = true) {

    const getContactDetails = (entity) => ({
        personName: entity?.contactName || "",
        phoneNumber: entity?.phone || "",
        companyName: entity?.companyName || ""
    });

    const getAddressDetails = (entity) => ({
        streetLines: [entity?.addressLineOne || "", entity?.addressLineTwo || ""],
        city: entity?.city || "",
        stateOrProvinceCode: entity?.state || "",
        postalCode: entity?.zipCode || "",
        countryCode: entity?.country || ""
    });

    const shipper = {
        contact: getContactDetails(payload?.returnShipper || payload?.fromShipper),
        address: getAddressDetails(payload?.returnShipper || payload?.fromShipper)
    };

    const recipient = {
        contact: getContactDetails(payload?.returnRecipient),
        address: getAddressDetails(payload?.returnRecipient)
    };

    const fedExObj = {
        labelResponseOptions: "URL_ONLY",
        requestedShipment: {
            shipper,
            recipients: [recipient],
            serviceType: payload?.service || "STANDARD_OVERNIGHT",
            packagingType: "FEDEX_ENVELOPE",
            pickupType: "USE_SCHEDULED_PICKUP",
            blockInsightVisibility: false,
            shippingChargesPayment: {
                paymentType: "SENDER"
            },
            labelSpecification: {
                imageType: "PDF",
                labelStockType: "PAPER_4X6",
                labelFormatType: "COMMON2D"
            },
            requestedPackageLineItems: [
                {
                    sequenceNumber: 1,
                    weight: {
                        value: 1,
                        units: "LB"
                    }
                }
            ]
        },
        returnShipmentDetail: {
            returnType: "PRINT_RETURN_LABEL"
        },
        accountNumber: {
            value: payload.accountNumber
        }
    };
    if (!isReturn) {
        delete fedExObj.returnShipmentDetail;
    }
    return fedExObj;
}


/* Check TID type exist*/
async function getCarrierTypeEmail(id: number) {
    const getData = await TidTypes.findOne({
        select: ["id", "name"],
        where: {
            id,
            name: ILike("email")
        },
    });
    return getData;
}

export {
    checkCountyContactForPrimary, checkCountyContactExists, checkTicketExists, checkTicketAssigneeExists, checkCustomerTransactionTypesCount, checkTransactionTypesCount,
    checkUserExists, generateInvoiceId, checkAssignedUsersForTicket, checkTagsExist, checkCarrierTypeExists,
    checkPriorityExists, checkCustomerExists, checkDepartmentExists, checkTicketStatusExists, checkValidDateReceived,
    checkTicketAssignedUsers, checkTicketTags, checkTicketTagExists, checkTagExists, checkTidTypeExists, checkTransactionTypeExists,
    checkContactExists, checkBasicInfoExists, checkDepartmentDataExists, checkUserAssignedDepartments, checkUserDepartment, checkCusContactForPrimary,
    formatPrice, checkTradeInInfoExists, getPriorityData, getTicketStatusData, getUser, checkSellerInfoExists, activityMentionConversion,
    mentionedUserFunction, checkBuyerInfoExists, checkStateExists, checkFmvDataExists, getInsuranceTypeName, getOdometerCodeName, getBuyerType,
    getIdOption, getActiveMil, plateTypeExist, checkDocumentExists, getExpirationDate, initialCostCalc, checkCountyExists, checkColorExists, getProcessingDate,
    filterYearlyGraph, checkCheatSheetExists, checkFmvMasterExists, getIdOptionValue, findTicket, checkTaxAbleMasterExists, checkTaxExemptionMasterExists, getSellerType,
    getCustomerAddress, getExpressMailFees, getTransactionReturnType, getBillingDepositType, findBillingInfoStartedLog, checkValidProcessingDate, commonDeleteHandler, getValue, findTicketsByTicketIds,
    getAllUserIds, getTotalTicketCount, convertToNumberIfNumeric, checkFilterBookmarkExists, getUserSpecificTeams, getStatusFromSlug, getTeamSpecificUsers, checkTicketNullValues,
    checkTicketTeamExists, getConfigVariables, checkValidSeller, checkBatchGroupExists, fedExShipmentJson,
    checkBatchExists, getCarrierTypeEmail, checkMultipleTicketAssigneeExists
}









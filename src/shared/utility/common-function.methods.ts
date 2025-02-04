import moment from 'moment';
import { User } from "../entity/user.entity";
import { DataSource, ILike, In } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OutletMenu } from '../entity/outlet-menu.entity';
import { Departments } from '../entity/departments.entity';
import { Customers } from '../entity/customers.entity';
import { SubItems } from '../entity/sub-items.entity';
import { CustomerTransactionTypes } from '../entity/customer-transaction-types.entity';
import { CustomerContacts } from '../entity/customer-contacts.entity';
import { UserDepartments } from '../entity/user-departments.entity';
import { InsuranceType } from '../enums/insurance-info.enum';
import { OdometerCodeEnum } from '../enums/trade-in-info.enum';
import { ActiveDutyMilEnum, BusinessTypeEnum, IDOptionEnum } from '../enums/buyer-info.enum';
import { ColorMaster } from '../entity/color-master.entity';
import { TransactionReturnTypeEnum } from '../enums/transaction-return-type.enum';
import { BillingDepositTypesEnum } from '../enums/billing-deposit-type.enum';
import { IdOptions } from '../enums/lien-info.enum';
import { throwException } from './throw-exception';
import { SellerTypeEnum } from '../enums/seller-info.enum';
import { ConfigMaster } from '../entity/config-master.entity';
import { PaymentMethods } from '../entity/tid-types.entity';


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
    const priority = await SubItems.findOne({
        select: ['id', 'name'],
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
    const carrierType = await OutletMenu.findOne({
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


/* generate work order id for ticket */
async function generateInvoiceId(ticketCount: number) {
    const dateFormat = moment().format('YY');
    const invoiceId = dateFormat + String.fromCharCode(65 + moment().month()) + ticketCount.toString().padStart(5, '0');
    return invoiceId;
}

/* get count of transaction types */
async function checkTransactionTypesCount(transactionTypesIds) {
    const checkTransactionTypes = await PaymentMethods.count({
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

/* Check TID type exist*/
async function checkTidTypeExists(id) {
    const getData = await PaymentMethods.findOne({
        where: { id: id, isDeleted: false }
    });
    if (!getData) {
        throw new NotFoundException(`ERR_TID_TYPE_NOT_FOUND`);
    }
    return getData;
}

/* Check transaction type exists*/
async function checkTransactionTypeExists(id) {
    const data = await PaymentMethods.findOne({
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


/* get priority data */
async function getPriorityData(priorityId) {
    const priority = await SubItems.findOne({
        select: ['id', 'name'],
        where: { id: priorityId }
    })
    if (!priority) { return null; }
    return priority;
}


/* get user */
async function getUser(userId: number) {
    const userExists = await User.findOne({
        select: ['id', 'isActive', 'username', 'firstName', 'lastName'],
        where: {
            id: userId,
        }
    })
    if (!userExists) { return null; }
    return userExists;
}

/* check if state exists */
async function checkStateExists(stateId: number) {
    console.log('stateId: ', stateId);

    return null;
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


/* check if county exists */
async function checkCountyExists(county: number) {
    console.log('county: ', county);
    return null
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


//convert input into a number
function convertToNumberIfNumeric(value) {
    // Check if the value is a numeric string
    if (!isNaN(value)) {
        return Number(value); // Convert the string to a number
    }
    return value;
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
    const getData = await PaymentMethods.findOne({
        select: ["id", "name"],
        where: {
            id,
            name: ILike("username")
        },
    });
    return getData;
}

export {
    checkCustomerTransactionTypesCount, checkTransactionTypesCount,
    checkUserExists, generateInvoiceId, checkAssignedUsersForTicket, checkCarrierTypeExists,
    checkPriorityExists, checkCustomerExists, checkDepartmentExists, checkValidDateReceived,
    checkTransactionTypeExists,
    checkContactExists, checkDepartmentDataExists, checkUserAssignedDepartments, checkUserDepartment, checkCusContactForPrimary,
    formatPrice, getPriorityData, getUser,
    checkStateExists, getInsuranceTypeName, getOdometerCodeName, getBuyerType,
    getIdOption, getActiveMil, checkCountyExists, checkColorExists, getProcessingDate,
    filterYearlyGraph, getIdOptionValue, getSellerType,
    getTransactionReturnType, getBillingDepositType, checkValidProcessingDate, commonDeleteHandler, getValue,
    getAllUserIds, convertToNumberIfNumeric, getUserSpecificTeams, getTeamSpecificUsers, checkTicketNullValues,
    checkTicketTeamExists, getConfigVariables, checkValidSeller, fedExShipmentJson,
    getCarrierTypeEmail, checkTidTypeExists
}









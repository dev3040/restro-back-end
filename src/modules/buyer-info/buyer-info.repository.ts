import { DataSource, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { getActiveMil, checkBuyerInfoExists, checkTicketExists, getBuyerType, checkCountyExists, getIdOptionValue } from 'src/shared/utility/common-function.methods';
import { AddBuyerInfoDto, UpdateBuyerInfoDto } from './dto/add-buyer-info.dto';
import { BuyerInfo } from 'src/shared/entity/buyer-info.entity';
import { BusinessTypeEnum } from 'src/shared/enums/buyer-info.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { ActivityLogPayload } from '../activity-logs/activity-log.interface';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { errorMessage } from 'src/config/common.config';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';


@Injectable()
export class BuyerInfoRepository extends Repository<BuyerInfo> {
    constructor(readonly dataSource: DataSource,
        private socketGateway: SocketGateway,
        private activityLogService: ActivityLogsService,
        private ticketsRepository: TicketsRepository) {
        super(BuyerInfo, dataSource.createEntityManager());
    }

    async addBuyerInfo(addBuyerInfo: AddBuyerInfoDto, user: User) {
        try {
            const ticket = await checkTicketExists(addBuyerInfo.ticketId);
            const county = await checkCountyExists(addBuyerInfo.countyId);
            const secCounty = await checkCountyExists(addBuyerInfo.secCountyId);

            // Validate only one of isOwner, isLessee, isLessor is true
            const roles = [addBuyerInfo.isOwner, addBuyerInfo.isLessee, addBuyerInfo.isLessor];
            const roleCount = roles.filter(role => role === true).length;

            if (roleCount !== 1) {
                throw new BadRequestException(errorMessage);
            }

            // Helper function to check if a role already exists
            const checkExistingRole = async (roleField: string, roleName: string) => {
                const existingRole = await BuyerInfo.findOne({ where: { [roleField]: true, ticketId: ticket.id, isDeleted: false } });
                if (existingRole) {
                    throw new BadRequestException(errorMessage);
                }
            };

            // Check for roles
            if (addBuyerInfo.isOwner) await checkExistingRole('isOwner', 'owner');
            if (addBuyerInfo.isLessee) await checkExistingRole('isLessee', 'lessee');
            if (addBuyerInfo.isLessor) await checkExistingRole('isLessor', 'lessor');

            // Create and save the new BuyerInfo record
            const buyerInfo = new BuyerInfo();
            Object.assign(buyerInfo, {
                type: addBuyerInfo.type,
                name: addBuyerInfo.name,
                email: addBuyerInfo.email,
                phone: addBuyerInfo.phone,
                secondaryType: addBuyerInfo.secondaryType,
                secondaryName: addBuyerInfo.secondaryName,
                secondaryEmail: addBuyerInfo.secondaryEmail,
                secondaryPhone: addBuyerInfo.secondaryPhone,
                address: addBuyerInfo.address,
                mailingAddress: addBuyerInfo.mailingAddress,
                secAddress: addBuyerInfo.secAddress,
                secMailingAddress: addBuyerInfo.secMailingAddress,
                ticketId: ticket.id,
                firstName: addBuyerInfo.firstName,
                secFirstName: addBuyerInfo.secFirstName,
                middleName: addBuyerInfo.middleName,
                secMiddleName: addBuyerInfo.secMiddleName,
                isResidential: addBuyerInfo.isResidential,
                secIsResidential: addBuyerInfo.secIsResidential,
                lastName: addBuyerInfo.lastName,
                secLastName: addBuyerInfo.secLastName,
                activeDutyMilitaryStationedInGa: addBuyerInfo.activeDutyMilitaryStationedInGa,
                secActiveDutyMilitaryStationedInGa: addBuyerInfo.secActiveDutyMilitaryStationedInGa,
                isMilitary: addBuyerInfo.isMilitary,
                secIsMilitary: addBuyerInfo.secIsMilitary,
                idOption: addBuyerInfo.idOption,
                secIdOption: addBuyerInfo.secIdOption,
                suffix: addBuyerInfo.suffix,
                secSuffix: addBuyerInfo.secSuffix,
                taxExempt: addBuyerInfo.taxExempt,
                secondaryTaxExempt: addBuyerInfo.secondaryTaxExempt,
                expireDate: addBuyerInfo.expireDate,
                secExpireDate: addBuyerInfo.secExpireDate,
                license: addBuyerInfo.license,
                secLicense: addBuyerInfo.secLicense,
                isPrimary: addBuyerInfo.isPrimary,
                isSecondary: addBuyerInfo.isSecondary,
                dob: addBuyerInfo.dob,
                secDob: addBuyerInfo.secDob,
                countyId: county ? county.id : null,
                secCountyId: secCounty ? secCounty.id : null,
                isLessee: addBuyerInfo.isLessee,
                isLessor: addBuyerInfo.isLessor,
                isPrimeAddClone: addBuyerInfo.isPrimeAddClone,
                isSecAddClone: addBuyerInfo.isSecAddClone,
                purchaseType: addBuyerInfo.purchaseType,
                secPurchaseType: addBuyerInfo.secPurchaseType,
                isOwner: addBuyerInfo.isOwner,
                district: addBuyerInfo.district,
                secDistrict: addBuyerInfo.secDistrict,
                createdBy: user.id
            });

            const data = await buyerInfo.save();
            const responseData = {
                type: data.type,
                name: data.name,
                email: data.email,
                phone: data.phone,
                secondaryType: data.secondaryType,
                secondaryName: data.secondaryName,
                secondaryEmail: data.secondaryEmail,
                secondaryPhone: data.secondaryPhone,
                address: data.address,
                mailingAddress: data.mailingAddress,
                secAddress: data.secAddress,
                secMailingAddress: data.secMailingAddress,
                ticketId: data.ticketId,
                firstName: data.firstName,
                secFirstName: data.secFirstName,
                middleName: data.middleName,
                secMiddleName: data.secMiddleName,
                isResidential: data.isResidential,
                secIsResidential: data.secIsResidential,
                lastName: data.lastName,
                secLastName: data.secLastName,
                activeDutyMilitaryStationedInGa: data.activeDutyMilitaryStationedInGa,
                secActiveDutyMilitaryStationedInGa: data.secActiveDutyMilitaryStationedInGa,
                isMilitary: data.isMilitary,
                secIsMilitary: data.secIsMilitary,
                idOption: data.idOption,
                secIdOption: data.secIdOption,
                suffix: data.suffix,
                secSuffix: data.secSuffix,
                taxExempt: data.taxExempt,
                secondaryTaxExempt: data.secondaryTaxExempt,
                expireDate: data.expireDate,
                secExpireDate: data.secExpireDate,
                license: data.license,
                secLicense: data.secLicense,
                isPrimary: data.isPrimary,
                isSecondary: data.isSecondary,
                dob: data.dob,
                secDob: data.secDob,
                countyId: data.countyId,
                isLessee: data.isLessee,
                isLessor: data.isLessor,
                isPrimeAddClone: data.isPrimeAddClone,
                isSecAddClone: data.isSecAddClone,
                purchaseType: data.purchaseType,
                secPurchaseType: data.secPurchaseType,
                isOwner: data.isOwner,
                district: data.district,
                secCountyId: data.secCountyId
            };

            return responseData;
        } catch (error) {
            throwException(error);
        }
    }
    async editBuyerInfo(updateBuyerInfo: UpdateBuyerInfoDto, id, user: User) {
        try {
            const buyerInfo = await checkBuyerInfoExists(id);
            const ticket = await checkTicketExists(updateBuyerInfo.ticketId);
            const county = await checkCountyExists(updateBuyerInfo.countyId)
            const secCounty = await checkCountyExists(updateBuyerInfo.secCountyId)
            buyerInfo.type = updateBuyerInfo.type;
            buyerInfo.name = updateBuyerInfo.name;
            buyerInfo.email = updateBuyerInfo.email;
            buyerInfo.phone = updateBuyerInfo.phone;
            buyerInfo.secondaryType = updateBuyerInfo.secondaryType;
            buyerInfo.secondaryName = updateBuyerInfo.secondaryName;
            buyerInfo.secondaryEmail = updateBuyerInfo.secondaryEmail;
            buyerInfo.secondaryPhone = updateBuyerInfo.secondaryPhone;
            buyerInfo.address = updateBuyerInfo.address;
            buyerInfo.mailingAddress = updateBuyerInfo.mailingAddress;
            buyerInfo.secAddress = updateBuyerInfo.secAddress;
            buyerInfo.secMailingAddress = updateBuyerInfo.secMailingAddress;
            buyerInfo.ticketId = ticket.id;
            buyerInfo.firstName = updateBuyerInfo.firstName;
            buyerInfo.secFirstName = updateBuyerInfo.secFirstName;
            buyerInfo.middleName = updateBuyerInfo.middleName;
            buyerInfo.secMiddleName = updateBuyerInfo.secMiddleName;
            buyerInfo.lastName = updateBuyerInfo.lastName;
            buyerInfo.secLastName = updateBuyerInfo.secLastName;
            buyerInfo.activeDutyMilitaryStationedInGa = updateBuyerInfo.activeDutyMilitaryStationedInGa;
            buyerInfo.secActiveDutyMilitaryStationedInGa = updateBuyerInfo.secActiveDutyMilitaryStationedInGa;
            buyerInfo.isMilitary = updateBuyerInfo.isMilitary;
            buyerInfo.secIsMilitary = updateBuyerInfo.secIsMilitary;
            buyerInfo.idOption = updateBuyerInfo.idOption;
            buyerInfo.secIdOption = updateBuyerInfo.secIdOption;
            buyerInfo.suffix = updateBuyerInfo.suffix;
            buyerInfo.secSuffix = updateBuyerInfo.secSuffix;
            buyerInfo.taxExempt = updateBuyerInfo.taxExempt;
            buyerInfo.secondaryTaxExempt = updateBuyerInfo.secondaryTaxExempt;
            buyerInfo.expireDate = updateBuyerInfo.expireDate;
            buyerInfo.secExpireDate = updateBuyerInfo.secExpireDate;
            buyerInfo.license = updateBuyerInfo.license;
            buyerInfo.secLicense = updateBuyerInfo.secLicense;
            buyerInfo.isSecondary = updateBuyerInfo.isSecondary;
            buyerInfo.dob = updateBuyerInfo.dob;
            buyerInfo.countyId = county ? county.id : null;
            buyerInfo.secCountyId = secCounty ? secCounty.id : null;
            buyerInfo.secDob = updateBuyerInfo.secDob;
            buyerInfo.isPrimary = updateBuyerInfo.isPrimary;
            buyerInfo.isPrimeAddClone = updateBuyerInfo.isPrimeAddClone;
            buyerInfo.isSecAddClone = updateBuyerInfo.isSecAddClone;
            buyerInfo.isResidential = updateBuyerInfo.isResidential;
            buyerInfo.secIsResidential = updateBuyerInfo.secIsResidential;
            buyerInfo.purchaseType = updateBuyerInfo.purchaseType;
            buyerInfo.secPurchaseType = updateBuyerInfo.secPurchaseType;
            buyerInfo.district = updateBuyerInfo.district;
            buyerInfo.secDistrict = updateBuyerInfo.secDistrict;
            buyerInfo.updatedBy = user.id;

            const data = await buyerInfo.save();
            let buyerDetails;
            if (data.type === BusinessTypeEnum.BUSINESS && data.secondaryType !== BusinessTypeEnum.INDIVIDUAL) {
                // Case when data.type === 1 and data.secondaryType !== 2
                buyerDetails = {
                    id: data.id,
                    type: data.type,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    secondaryType: data.secondaryType,
                    secondaryName: data.secondaryName,
                    secondaryEmail: data.secondaryEmail,
                    secondaryPhone: data.secondaryPhone,
                    address: data.address,
                    ticketId: data.ticketId,
                    mailingAddress: data.mailingAddress,
                    secAddress: data.secAddress,
                    secMailingAddress: data.secMailingAddress,
                    countyId: data.countyId,
                    isResidential: data.isResidential,
                    purchaseType: data.purchaseType,
                    isOwner: data.isOwner,
                    isPrimary: data.isPrimary
                };
            } else if (data.type === BusinessTypeEnum.BUSINESS && data.secondaryType === BusinessTypeEnum.INDIVIDUAL) {
                // Case when data.type === 1 and data.secondaryType === 2
                buyerDetails = {
                    id: data.id,
                    type: data.type,
                    name: data.name,
                    firstName: data.firstName,
                    middleName: data.middleName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    isResidential: data.isResidential,
                    secIsResidential: data.secIsResidential,
                    ticketId: data.ticketId,
                    mailingAddress: data.mailingAddress,
                    activeDutyMilitaryStationedInGa: data.activeDutyMilitaryStationedInGa,
                    isMilitary: data.isMilitary,
                    idOption: data.idOption,
                    suffix: data.suffix,
                    taxExempt: data.taxExempt,
                    expireDate: data.expireDate,
                    license: data.license,
                    bdob: data.dob,
                    secAddress: data.secAddress,
                    secMailingAddress: data.secMailingAddress,
                    secAddClone: data.isSecAddClone,
                    priAddClone: data.isPrimeAddClone,
                    purchaseType: data.purchaseType,
                    isOwner: data.isOwner,
                    isPrimary: data.isPrimary
                };
            } else {
                buyerDetails = {
                    id: data.id,
                    type: data.type,
                    secType: data.secondaryType,
                    name: data.name,
                    secName: data.secondaryName,
                    firstName: data.firstName,
                    secFirstName: data.secFirstName,
                    middleName: data.middleName,
                    secMiddleName: data.secMiddleName,
                    lastName: data.lastName,
                    secLastName: data.secLastName,
                    email: data.email,
                    secEmail: data.secondaryEmail,
                    phone: data.phone,
                    secPhone: data.secondaryPhone,
                    address: data.address,
                    isResidential: data.isResidential,
                    secIsResidential: data.secIsResidential,
                    ticketId: data.ticketId,
                    mailingAddress: data.mailingAddress,
                    activeDutyMilitaryStationedInGa: data.activeDutyMilitaryStationedInGa,
                    secActiveDutyMilitaryStationedInGa: data.secActiveDutyMilitaryStationedInGa,
                    isMilitary: data.isMilitary,
                    secIsMilitary: data.secIsMilitary,
                    idOption: data.idOption,
                    secIdOption: data.secIdOption,
                    suffix: data.suffix,
                    secSuffix: data.secSuffix,
                    taxExempt: data.taxExempt,
                    secTaxExempt: data.secondaryTaxExempt,
                    expireDate: data.expireDate,
                    secExpireDate: data.secExpireDate,
                    license: data.license,
                    secLicense: data.secLicense,
                    bdob: data.dob,
                    secDob: data.secDob,
                    secAddress: data.secAddress,
                    secMailingAddress: data.secMailingAddress,
                    secAddClone: data.isSecAddClone,
                    priAddClone: data.isPrimeAddClone,
                    countyId: data.countyId,
                    purchaseType: data.purchaseType,
                    isOwner: data.isOwner,
                    secPurchaseType: data.secPurchaseType,
                    isPrimary: data.isPrimary,
                    district: data.district,
                    secDistrict: data.secDistrict
                };
            }
            return buyerDetails;

        } catch (error) {
            throwException(error);
        }
    }
    async getBuyerInfoById(id) {
        try {
            const getBuyerDetails = await this.manager.createQueryBuilder(BuyerInfo, "buyerInfo")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect("county.countyProcessing", "countyProcessing")
                .leftJoinAndSelect("buyerInfo.secCounty", "secCounty")
                .where("buyerInfo.id = :id", { id: id })
                .andWhere("buyerInfo.isDeleted = false")
                .select([
                    "buyerInfo.id", "buyerInfo.type", "buyerInfo.name", "buyerInfo.secondaryType", "buyerInfo.secondaryName",
                    "buyerInfo.address", "buyerInfo.mailingAddress", "buyerInfo.email", "buyerInfo.secondaryEmail", "buyerInfo.phone",
                    "buyerInfo.secondaryPhone", "buyerInfo.firstName", "buyerInfo.middleName", "buyerInfo.lastName", "buyerInfo.suffix",
                    "buyerInfo.license", "buyerInfo.dob", "buyerInfo.ticketId", "buyerInfo.isSecondary", "buyerInfo.isMilitary",
                    "buyerInfo.idOption", "buyerInfo.taxExempt", "buyerInfo.activeDutyMilitaryStationedInGa", "buyerInfo.isLessee", "buyerInfo.isLessor",
                    "buyerInfo.secActiveDutyMilitaryStationedInGa", "buyerInfo.secondaryTaxExempt", "buyerInfo.secLastName",
                    "buyerInfo.secMiddleName", "buyerInfo.secFirstName", "buyerInfo.secSuffix", "buyerInfo.secDob", "buyerInfo.secIdOption",
                    "buyerInfo.secLicense", "buyerInfo.expireDate", "buyerInfo.secExpireDate", "buyerInfo.secIsMilitary", "buyerInfo.secAddress",
                    "buyerInfo.secMailingAddress", "buyerInfo.isSecAddClone", "buyerInfo.isPrimeAddClone", "buyerInfo.isResidential", "buyerInfo.secIsResidential",
                    "buyerInfo.isOwner", "buyerInfo.purchaseType", "buyerInfo.secPurchaseType", "buyerInfo.isPrimary", "buyerInfo.countyId", "buyerInfo.secCountyId",
                    "buyerInfo.district", "buyerInfo.secDistrict", "county.id", "county.name", "secCounty.id", "secCounty.name",
                    "countyProcessing.type"
                ]).getOne();

            if (!getBuyerDetails) {
                throw new NotFoundException(`ERR_BUYER_INFO_NOT_FOUND&&&id`);
            }
            return getBuyerDetails;
        } catch (error) {
            throwException(error);
        }
    }
    async getBuyerInfo(id) {
        try {
            const getBuyerDetails: any = await this.manager.createQueryBuilder(BuyerInfo, "buyerInfo")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect("buyerInfo.secCounty", "secCounty")
                .where("buyerInfo.id = :id", { id: id })
                .andWhere("buyerInfo.isDeleted = false")
                .select([
                    "buyerInfo.id", "buyerInfo.type", "buyerInfo.name", "buyerInfo.secondaryType", "buyerInfo.secondaryName",
                    "buyerInfo.address", "buyerInfo.mailingAddress", "buyerInfo.email", "buyerInfo.secondaryEmail", "buyerInfo.phone",
                    "buyerInfo.secondaryPhone", "buyerInfo.firstName", "buyerInfo.middleName", "buyerInfo.lastName", "buyerInfo.suffix",
                    "buyerInfo.license", "buyerInfo.dob", "buyerInfo.ticketId", "buyerInfo.isSecondary", "buyerInfo.isMilitary",
                    "buyerInfo.idOption", "buyerInfo.taxExempt", "buyerInfo.activeDutyMilitaryStationedInGa",
                    "buyerInfo.secActiveDutyMilitaryStationedInGa", "buyerInfo.secondaryTaxExempt", "buyerInfo.secLastName",
                    "buyerInfo.secMiddleName", "buyerInfo.secFirstName", "buyerInfo.secSuffix", "buyerInfo.secDob", "buyerInfo.secIdOption",
                    "buyerInfo.secLicense", "buyerInfo.secExpireDate", "buyerInfo.secIsMilitary", "buyerInfo.secAddress",
                    "buyerInfo.secMailingAddress", "buyerInfo.isSecAddClone", "buyerInfo.isPrimeAddClone", "buyerInfo.isResidential", "buyerInfo.secIsResidential",
                    "buyerInfo.isOwner", "buyerInfo.purchaseType", "buyerInfo.secPurchaseType", "buyerInfo.isPrimary",
                    "buyerInfo.district", "buyerInfo.secDistrict", "county.id", "county.name", "secCounty.id", "secCounty.name",

                ]).getMany();

            const buyerDetails = getBuyerDetails.map(buyer => {
                if (buyer.secondaryType !== BusinessTypeEnum.INDIVIDUAL) {
                    const { secActiveDutyMilitaryStationedInGa, secondaryTaxExempt, secFirstName, secMiddleName, secLastName, secMailingAddress,
                        secSuffix, secDob, secIdOption, secLicense, secExpireDate, secIsMilitary, secAddress, secIsResidential, isSecAddClone, ...filteredBuyer } = buyer;
                    return filteredBuyer;
                }
                return buyer;
            });
            return { buyerDetails };

        } catch (error) {
            throwException(error);
        }
    }
    async saveBuyerInfo(addBuyerInfo: AddBuyerInfoDto, userId: number, isSummary: boolean) {
        try {
            let isUpdate: boolean;
            let buyerInfo: any;
            let newId: number;
            let isNewBuyer: boolean;
            let ticket_id: number;

            // Ensure only one of isLessor, isLessee, or isOwner is true
            const roles = [addBuyerInfo.isLessor, addBuyerInfo.isLessee, addBuyerInfo.isOwner];
            const trueRolesCount = roles.filter(role => role === true).length;

            if (trueRolesCount > 1) {
                throw new Error("ERROR_MESSAGE");
            }

            if (addBuyerInfo?.id) {
                newId = addBuyerInfo.id;
                buyerInfo = await this.getBuyerInfoById(newId);
                const criteria = { id: newId };
                ticket_id = buyerInfo.ticketId;

                // Update the existing record 
                await this.update(criteria, { ...addBuyerInfo, ticketId: ticket_id, updatedBy: userId });
                isUpdate = true;

            } else if (addBuyerInfo?.ticketId) {
                await checkTicketExists(addBuyerInfo.ticketId);//new entry

                const getFromData = await BuyerInfo.findOne({
                    select: ["id", "ticketId"],
                    where: { ticketId: addBuyerInfo.ticketId }
                })
                // Create a new record
                buyerInfo = this.create({ ...addBuyerInfo, createdBy: userId });
                const addedData = await this.save(buyerInfo);
                newId = addedData.id;
                isNewBuyer = true;
                isUpdate = !!getFromData;
                ticket_id = addBuyerInfo.ticketId;
            }

            let latestBuyerInfo: any = await this.getBuyerInfoById(newId);
            let updatedData: any;
            // assign role of latestBuyerInfo
            if (latestBuyerInfo.isOwner && !latestBuyerInfo.isLessee && !latestBuyerInfo.isLessor) {
                updatedData = { owner: latestBuyerInfo };
            } else if (latestBuyerInfo.isLessee && !latestBuyerInfo.isOwner && !latestBuyerInfo.isLessor) {
                updatedData = { lessee: latestBuyerInfo };
            } else {
                updatedData = { lessor: latestBuyerInfo };
            }
            // Emit data for updated data 
            this.socketGateway.formDataUpdatedEvent(addBuyerInfo.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, updatedData, DataEntryFormType.BUYER_INFO);

            // ACTIVITY LOG
            if (isUpdate) {
                if (isNewBuyer) {
                    const data: ActivityLogPayload = {
                        userId,
                        actionType: ActivityLogActionType.FORM_NEW_RECORD,
                        ticketId: ticket_id,
                        fieldName: null,
                        newData: null,
                        oldData: null,
                        formType: DataEntryFormType.BUYER_INFO_ACTIVITY
                    }

                    this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                } else {
                    let changes: any[] = [];
                    const unWantedKeys = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'id', 'isActive', 'ticketId', 'isDeleted', 'isMilitary', 'secIsMilitary',
                        'isPrimeAddClone', 'isSecondary', 'secIsResidential', 'isSecAddClone', 'isPrimary', 'secCounty', 'county', 'secondaryTaxExempt', 'taxExempt'];

                    unWantedKeys.forEach(key => { delete latestBuyerInfo[key] });

                    const fieldMap = {
                        type: "Type",
                        name: "Name",
                        secondaryType: "Secondary type",
                        secondaryName: "Secondary name",
                        email: "Email",
                        secondaryEmail: "Secondary email",
                        phone: "Phone",
                        secondaryPhone: "Secondary phone",
                        address: "Address",
                        mailingAddress: "Mailing address",
                        secAddress: "Secondary address",
                        secMailingAddress: "Secondary mailing address",
                        idOption: "Id option",
                        secIdOption: "Secondary id option",
                        firstName: "First name",
                        secFirstName: "Secondary first name",
                        middleName: "Middle name",
                        secMiddleName: "Secondary middle name",
                        lastName: "Last name",
                        secLastName: "Secondary last name",
                        license: "License",
                        secLicense: "Secondary license",
                        suffix: "Suffix",
                        secSuffix: "Secondary suffix",
                        activeDutyMilitaryStationedInGa: "Active duty military stationed in GA",
                        secActiveDutyMilitaryStationedInGa: "Secondary active duty military stationed in GA",
                        isMilitary: "Military",
                        secIsMilitary: "Secondary military",
                        dob: "Dob",
                        secDob: "Secondary dob",
                        expireDate: "Expire date",
                        secExpireDate: "Secondary expire date",
                        countyId: "County",
                        secCountyId: "Secondary county",
                        district: "District",
                        secDistrict: "Secondary district",
                    };
                    const transformFunctions = {
                        type: getBuyerType,
                        secondaryType: getBuyerType,
                        idOption: getIdOptionValue,
                        secIdOption: getIdOptionValue,
                        activeDutyMilitaryStationedInGa: getActiveMil,
                        secActiveDutyMilitaryStationedInGa: getActiveMil,
                        countyId: (value) => buyerInfo.countyId ? buyerInfo?.county?.name : null,
                        secCountyId: (value) => buyerInfo.secCountyId ? buyerInfo?.county?.name : null,
                    };

                    for (let key in latestBuyerInfo) {
                        if (buyerInfo[key] !== latestBuyerInfo[key]) {
                            const fieldName = fieldMap[key] || key;
                            const oldValue = transformFunctions[key] ? transformFunctions[key](buyerInfo[key]) : buyerInfo[key];
                            const newValue = transformFunctions[key] ? transformFunctions[key](latestBuyerInfo[key]) : latestBuyerInfo[key];

                            changes.push({
                                fieldName: fieldName,
                                actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                                oldValue: oldValue,
                                newValue: newValue,
                            });
                        }
                    }
                    if (changes.length > 0) {
                        const data: ActivityLogPayload[] = changes.map(change => ({
                            userId: userId,
                            actionType: change.actionType,
                            ticketId: ticket_id,
                            fieldName: change.fieldName,
                            newData: change.newValue,
                            oldData: change.oldValue,
                            formType: !isSummary ? DataEntryFormType.BUYER_INFO_ACTIVITY : DataEntryFormType.SUMMARY_BUYER_INFO_ACTIVITY
                        }));
                        this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
                    }
                }
            } else {
                const data: ActivityLogPayload = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: ticket_id,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: !isSummary ? DataEntryFormType.BUYER_INFO_ACTIVITY : DataEntryFormType.SUMMARY_BUYER_INFO_ACTIVITY
                }
                this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_START);
            }
            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticket_id, userId);
        } catch (error) {
            throwException(error);
        }
    }
    async deleteBuyer(buyerDto) {
        try {
            const buyerInfo = await checkBuyerInfoExists(buyerDto.id);
            const isPrimary = buyerDto.isPrimary === true || buyerDto.isPrimary === 'true';
            const isIndividual = buyerDto.isIndividual === true || buyerDto.isIndividual === 'true';

            const nullifyFields = (fields) => {
                fields.forEach(field => {
                    buyerInfo[field] = null;
                });
            };

            if (isPrimary && !isIndividual) {
                nullifyFields([
                    'name', 'type', 'email', 'phone', 'address', 'countyId', 'district', 'mailingAddress'
                ]);
                buyerInfo.isPrimeAddClone = false;
                buyerInfo.isResidential = false;

            } else if (!isPrimary && !isIndividual) {
                nullifyFields([
                    'secondaryType', 'secondaryName', 'secondaryEmail', 'secondaryPhone', 'secAddress', 'secDistrict', 'secCountyId', 'secMailingAddress', 'isSecondary'
                ]);
                buyerInfo.isSecAddClone = false;
                buyerInfo.secIsResidential = false;
            } else if (isPrimary && isIndividual) {
                nullifyFields([
                    'type', 'name', 'idOption', 'license', 'expireDate', 'dob', 'firstName', 'middleName', 'lastName', 'suffix',
                    'email', 'phone', 'isMilitary', 'taxExempt', 'address', 'activeDutyMilitaryStationedInGa', 'mailingAddress',
                    'countyId', 'district'
                ]);
                buyerInfo.isPrimeAddClone = false;
                buyerInfo.isResidential = false;
            } else if (!isPrimary && isIndividual) {
                nullifyFields([
                    'secondaryType', 'secondaryName', 'secIdOption', 'secLicense', 'secExpireDate', 'secDob', 'secFirstName', 'secLastName', 'secMiddleName', 'secSuffix', 'secondaryEmail', 'secondaryPhone', 'secActiveDutyMilitaryStationedInGa', 'secIsMilitary', 'secondaryTaxExempt', 'secAddress', 'secMailingAddress', 'secCountyId', 'secDistrict', 'isSecondary'
                ]);
                buyerInfo.isSecAddClone = false;
                buyerInfo.secIsResidential = false;
            }

            if (buyerDto.primary === true || buyerDto.primary === 'true') buyerInfo.isPrimary = null;
            if (buyerDto.secondary === true || buyerDto.secondary === 'true') buyerInfo.isSecondary = null;

            const buyerData = await BuyerInfo.save(buyerInfo);
            let data: any;
            if (buyerData.isLessee && !buyerData.isLessor && !buyerData.isOwner) {
                data = { lessee: buyerData };
            } else if (!buyerData.isLessee && buyerData.isLessor && !buyerData.isOwner) {
                data = { lessor: buyerData };
            } else if (!buyerData.isLessee && !buyerData.isLessor && buyerData.isOwner) {
                data = { owner: buyerData };
            }
            this.socketGateway.formDataUpdatedEvent(buyerInfo.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, data, DataEntryFormType.BUYER_INFO);

            return {
                message: "SUC_BUYER_INFO_DELETED",
                data
            };
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new Error("ERROR_MESSAGE");
        }
    }
    async deletePurchaseTypeData(id) {
        try {
            const buyerInfo = await checkBuyerInfoExists(id);
            // Nullify all fields 
            for (const key in buyerInfo) {
                if (buyerInfo.hasOwnProperty(key) && key !== 'id' && key !== 'ticketId' && key !== 'isActive'
                    && key !== 'isDeleted' && key !== 'createdAt' && key !== 'updatedAt') {
                    buyerInfo[key] = null;
                }
            }

            await BuyerInfo.save(buyerInfo);
            let data: any = {
                lessor: [],
                lessee: [],
                owner: []
            };

            this.socketGateway.formDataUpdatedEvent(buyerInfo.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, data, DataEntryFormType.BUYER_INFO);
            return {
                message: "SUC_BUYER_INFO_DELETED"
            };
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new Error("ERROR_MESSAGE");
        }
    }
}




import { DataSource, Repository } from 'typeorm';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { RegistrationInfoDto } from './dto/add-registration-info.dto';
import { throwException } from 'src/shared/utility/throw-exception';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { checkTicketExists, formatPrice, getConfigVariables, getExpirationDate, initialCostCalc, plateTypeExist } from 'src/shared/utility/common-function.methods';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RegistrationInfo } from 'src/shared/entity/registration-info.entity';
import { SocketGateway } from '../socket/socket.gateway';
import { VinInfoRepository } from '../vin-info/vin-info.repository';
import { Tickets } from 'src/shared/entity/tickets.entity';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';


@Injectable()
export class RegistrationInfoRepository extends Repository<RegistrationInfo> {
    constructor(
        readonly dataSource: DataSource,
        @Inject(forwardRef(() => VinInfoRepository))
        private readonly vinInfoRepository: VinInfoRepository,
        private ticketsRepository: TicketsRepository,
        private activityLogService: ActivityLogsService, private socketGateway: SocketGateway) {
        super(RegistrationInfo, dataSource.createEntityManager(),
        );
    }

    async saveRegistrationInfo(regInfoDto: RegistrationInfoDto, userId: number): Promise<RegistrationInfo> {
        try {
            let isUpdate: boolean;
            const ticket = await checkTicketExists(regInfoDto.ticketId);
            const config = await getConfigVariables(["commercialAlternativeFuelFee", "nonCommercialAlternativeFuelFee"]);
            if (regInfoDto?.plateTypeId)
                await plateTypeExist(regInfoDto?.plateTypeId)

            if (regInfoDto?.initialTotalCost) {
                regInfoDto.initialTotalCost = formatPrice(regInfoDto.initialTotalCost)
            }

            let regInfo: any = await this.getRegInfo(regInfoDto.ticketId);
            let { vinInfo } = await this.getCalcInfo(ticket.id);
            if (regInfoDto?.gvw) {
                await this.vinInfoRepository.setVinInfo({ gvw: regInfoDto.gvw, ticketId: ticket.id }, ticket.vinId, userId, false)
            }
            if (regInfo) {
                if (regInfoDto.hasOwnProperty('plateTransfer')) {
                    regInfoDto.isForHire = false;
                    regInfoDto.isHighwayImpact50 = false;
                    regInfoDto.isRenewTwoYears = false;
                    regInfoDto.isHighwayImpact100 = false;
                    regInfoDto.isAlternativeFuelFee = false;
                    regInfoDto.expirationDate = null;
                    regInfoDto.plateNumber = null;
                }
                await this.update(regInfo.id, {
                    ...regInfoDto,
                    primaryFuelType: vinInfo?.primaryFuelType,
                    secondaryFuelType: vinInfo?.secondaryFuelType,
                    type: vinInfo?.type,
                    updatedBy: userId
                });
                isUpdate = true;
            } else {
                regInfo = this.create({
                    ...regInfoDto, createdBy: userId, primaryFuelType: vinInfo?.primaryFuelType,
                    secondaryFuelType: vinInfo?.secondaryFuelType,
                    type: vinInfo?.type,
                });
                await this.save(regInfo);
                isUpdate = false;
            }

            const latestRegInfo: any = await this.getRegInfo(regInfoDto.ticketId);
            const initialCost = initialCostCalc({ ...latestRegInfo, ...{ config } });
            latestRegInfo.initialTotalCost = initialCost.totalInitialCost
            latestRegInfo.costCalc = JSON.stringify(initialCost);
            await latestRegInfo.save();

            latestRegInfo.costCalc = initialCost;

            /* Emit data ===>>> [Reg] */
            this.socketGateway.formDataUpdatedEvent(
                regInfoDto.ticketId,
                SocketEventEnum.FORM_DETAILS_UPDATE,
                latestRegInfo,
                DataEntryFormType.REGISTRATION_INFO
            );
            // ACTIVITY LOG 
            let data;
            if (isUpdate && !regInfoDto.hasOwnProperty('plateTransfer')) {
                const changes: any[] = [];
                const fieldMappings = {
                    expirationDate: "expiration date",
                    plateTypeId: "plate type",
                    plateTransfer: "plate transfer",
                    plateNumber: "plate number",
                    gvw: "gvw",
                    veteranExempt: "veteran exempt",
                    initialTotalCost: "initial total cost",
                    emissionVerified: "emission verified",
                    isRenewTwoYears: "renew for 2 years",
                    isHighwayImpact50: "highway impact  GVW 15500-26000 $50",
                    isHighwayImpact100: "highway impact GVW Over 26000 $100",
                    isAlternativeFuelFee: "alternative Fuel Fee",
                    isForHire: "for hire",
                    line2209: "for hire",
                    mailingAddress: "mailing address"
                };
                for (let key in latestRegInfo) {
                    if (regInfo[key] != latestRegInfo[key] && fieldMappings[key]) {
                        const fieldName = fieldMappings[key] || key;
                        let oldValue = regInfo[key];
                        let newValue = latestRegInfo[key];

                        if (key == "initialTotalCost") {
                            oldValue = formatPrice(oldValue);
                            newValue = formatPrice(newValue);
                        } else if (key == "plateTypeId") {
                            oldValue = regInfo?.plate?.plateDetails || null;
                            newValue = latestRegInfo?.plate?.plateDetails || null;
                        }

                        changes.push({ fieldName, oldValue, newValue });
                    }
                }
                if (changes.length > 0) {
                    data = changes.map(change => ({
                        userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: regInfoDto.ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: DataEntryFormType.REGISTRATION_INFO_ACTIVITY
                    }));
                }
            } else if (!isUpdate) {
                data = {
                    userId: userId,
                    actionType: ActivityLogActionType.FORM_START,
                    ticketId: regInfoDto.ticketId,
                    fieldName: null,
                    newData: null,
                    oldData: null,
                    formType: DataEntryFormType.REGISTRATION_INFO_ACTIVITY
                }
            }
            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(regInfoDto.ticketId, userId);

            return latestRegInfo;
        } catch (error) {
            throwException(error);
        }
    }

    async getRegInfo(ticketId: number) {
        try {
            const data: any = await this.manager.createQueryBuilder(RegistrationInfo, "regInfo")
                .leftJoinAndSelect("regInfo.plate", "plate")
                .leftJoinAndSelect("plate.plateTypes", "plateTypes")
                .leftJoinAndSelect("regInfo.ticket", "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.titleInfo", "titleInfo")
                .leftJoinAndSelect("titleInfo.titleState", "titleState")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect("ticket.tavtForm", "tavtForm")
                .select([
                    "regInfo.id",
                    "regInfo.ticketId",
                    "regInfo.plateTypeId",
                    "regInfo.plateTransfer",
                    "regInfo.plateNumber",
                    "plateTypes.slug",
                    "regInfo.expirationDate",
                    "regInfo.gvw",
                    "regInfo.type",
                    "regInfo.primaryFuelType",
                    "regInfo.secondaryFuelType",
                    "regInfo.veteranExempt",
                    "regInfo.initialTotalCost",
                    "regInfo.emissionVerified",
                    "regInfo.isRenewTwoYears",
                    "regInfo.isHighwayImpact50",
                    "regInfo.isHighwayImpact100",
                    "regInfo.isAlternativeFuelFee",
                    "regInfo.isRenewTwoYearsRegExp",
                    "regInfo.isForHire",
                    "regInfo.line2209",
                    "regInfo.is2290",
                    "regInfo.mailingAddress",
                    "regInfo.costCalc",
                    "plate.id",
                    "plate.plateDetails",
                    "plate.categoryCode",
                    "plate.standardFee",
                    "plate.annualSpecialFee",
                    "plate.manufacturingFee",
                    "plate.quarterCalc",
                    "plate.isRegQuarter",
                    "plate.isTransferable",
                    "ticket.vinId",
                    "ticket.startDate",
                    "vinInfo.gvw",
                    "vinInfo.primaryFuelType",
                    "vinInfo.secondaryFuelType",
                    "vinInfo.vehicleUse",
                    "buyerInfo.countyId",
                    "buyerInfo.dob",
                    "buyerInfo.name",
                    "buyerInfo.type",
                    "buyerInfo.isLessee",
                    "county.code",
                    "titleInfo.stateId",
                    "titleState.code",
                    "tavtForm.valoremCalc"
                ])
                .where(`(regInfo.ticketId = :ticketId)`, { ticketId })
                .getOne();

            return data;
        } catch (error) {
            throwException(error);
        }
    }

    async getCalcInfo(ticketId: number) {
        try {
            const data = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo")
                .leftJoinAndSelect("ticket.titleInfo", "titleInfo")
                .leftJoinAndSelect("titleInfo.titleState", "titleState")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect("ticket.registrationInfo", "regInfo")
                .leftJoinAndSelect("ticket.tavtForm", "tavtForm")
                .leftJoinAndSelect("regInfo.plate", "plate")
                .leftJoinAndSelect("plate.plateTypes", "plateTypes")
                .select([
                    "ticket.vinId",
                    "ticket.startDate",
                    "vinInfo.gvw",
                    "vinInfo.primaryFuelType",
                    "vinInfo.type",
                    "vinInfo.secondaryFuelType",
                    "buyerInfo.dob",
                    "buyerInfo.name",
                    "buyerInfo.type",
                    "buyerInfo.isLessee",
                    "buyerInfo.countyId",
                    "county.code",
                    "titleInfo.stateId",
                    "titleState.code",
                    "tavtForm.valoremCalc",
                    "regInfo.plateTypeId",
                    "plate.id",
                    "plateTypes.slug"
                ])
                .where(`(ticket.id = :ticketId)`, { ticketId })
                .orderBy("buyerInfo.updatedAt", "DESC")
                .getOne();
            return getExpirationDate(data);
        } catch (error) {
            throwException(error);
        }
    }
}



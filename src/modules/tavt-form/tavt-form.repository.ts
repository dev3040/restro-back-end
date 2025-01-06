import { DataSource, In, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TavtForm } from 'src/shared/entity/tavt-form.entity';
import { checkTicketExists, getExpirationDate } from 'src/shared/utility/common-function.methods';
import { throwException } from 'src/shared/utility/throw-exception';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { DataEntryFormType } from 'src/shared/enums/form-type.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { SocketGateway } from '../socket/socket.gateway';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { TavtOtherFees } from 'src/shared/entity/tavt-other-fees.entity';
import { Tickets } from 'src/shared/entity/tickets.entity';
import moment from 'moment';
import { TavtTaxMaster } from 'src/shared/entity/tavt-master.entity';
import { BusinessTypeEnum } from 'src/shared/enums/buyer-info.enum';
import { TitleCounties } from 'src/shared/entity/title-counties.entity';
import { CountyMilage } from 'src/shared/entity/county-milage.entity';
import { valoremTacPenalty } from 'src/config/common.config';
import { SalesTaxMaster } from 'src/shared/entity/sales-tax-master.entity';
import { TicketsRepository } from '../ticket-management/ticket-management.repository';


@Injectable()
export class TavtRepository extends Repository<TavtForm> {
    constructor(
        readonly dataSource: DataSource,
        private ticketsRepository: TicketsRepository,
        private activityLogService: ActivityLogsService, private socketGateway: SocketGateway) {
        super(TavtForm, dataSource.createEntityManager(),
        );
    }

    async saveTavtForm(tavtFormDto, userId: number, isSummary: boolean): Promise<TavtForm> {
        try {
            const { isNotLog, otherFees, ...payload } = tavtFormDto;

            await checkTicketExists(tavtFormDto.ticketId);

            let isUpdate: boolean;
            let tavtForm: any = await this.getTavtForm(tavtFormDto.ticketId);

            //Reset TAVT form
            if (tavtFormDto.isSales === true && tavtForm && tavtForm.isSales !== true) {
                await TavtOtherFees.delete({ formId: tavtForm.id });
                await TavtForm.delete({ id: tavtForm.id });
                this.saveTavtForm({ ticketId: tavtFormDto.ticketId, isSales: true }, userId, isSummary);
            } else if (tavtFormDto.isSales === false && tavtForm && tavtForm.isSales !== false) {
                await TavtOtherFees.delete({ formId: tavtForm.id });
                await TavtForm.delete({ id: tavtForm.id });
                this.saveTavtForm({ ticketId: tavtFormDto.ticketId, isSales: false }, userId, isSummary);
            }

            if (tavtForm) {
                await this.update(tavtForm.id, { ...payload, updatedBy: userId });
                isUpdate = true;
            } else {
                tavtForm = this.create({ ...payload, createdBy: userId });
                await this.save(tavtForm);
                isUpdate = false;
            }

            if (otherFees?.length) {
                const existingOtherFee = tavtFormDto?.otherFees.filter(v => v.id != null)
                    .map(v => ({ ...v, updatedBy: userId }));
                const newOtherFees = tavtFormDto?.otherFees.filter(v => v.id == null)
                    .map(v => ({ ...v, createdBy: userId }));
                if (existingOtherFee.length > 0) {
                    const ids = existingOtherFee.map(update => update.id);

                    const entitiesToUpdate = await TavtOtherFees.find({
                        select: ["id"],
                        where: { id: In(ids) }
                    });
                    if (entitiesToUpdate.length !== ids.length) {
                        throw new NotFoundException('ERR_OTHER_FEES_NOT_FOUND&&&otherFees');
                    }
                    await Promise.all(existingOtherFee.map(async fees => {
                        const foundEntity = entitiesToUpdate.find(entity => entity.id == fees.id);
                        if (foundEntity) {
                            Object.assign(foundEntity, fees);
                            await foundEntity.save();
                        }
                    }));
                }
                if (newOtherFees.length > 0) {
                    await this.manager.createQueryBuilder()
                        .insert()
                        .into(TavtOtherFees)
                        .values(newOtherFees)
                        .execute();
                }
            }

            const latestTavtForm: any = await this.getTavtForm(tavtForm.ticketId);
            if (latestTavtForm) {
                const costCalc = await this.taxableCostCalc(latestTavtForm);
                latestTavtForm.taxableValue = costCalc.total;
                latestTavtForm.tavtDealerPenalty = costCalc.tavtDealerPenalty
                latestTavtForm.tavtValue = costCalc.tavtValue;
                latestTavtForm.salesTaxValue = costCalc.salesTaxValue;
                latestTavtForm.costCalc = JSON.stringify(costCalc);
                latestTavtForm.valoremCalc = JSON.stringify(costCalc?.valoremCalc || []);
                latestTavtForm.valoremPenalty = costCalc.valoremPenalty;
                latestTavtForm.valoremValue = costCalc.valoremValue;
                await latestTavtForm.save();
                latestTavtForm.valoremCalc = costCalc.valoremCalc;
                latestTavtForm.costCalc = costCalc;

                // Emit data ===>>> [Tavt] 
                this.socketGateway.formDataUpdatedEvent(
                    tavtForm.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestTavtForm, DataEntryFormType.TAVT_FORM);
            }

            // ACTIVITY LOG 
            let data;
            if (isUpdate && latestTavtForm && !isNotLog) {
                const changes: any[] = [];
                const fieldMappings = {
                    arrivalDate: "Arrival Date",
                    salesPrice: "Sales Price",
                    rebates: "Rebates",
                    discount: "Discount",
                    accessories: "Accessories",
                    administrationFees: "Administration Fees",
                    dealerHandling: "Dealer Handling",
                    deliveryFees: "Delivery Fees",
                    documentationFees: "Documentation Fees",
                    shippingHandlingFees: "Shipping & Handling Fees",
                    taxableValue: "Taxable Value",
                    taxExemptionId: "Tax Exemption ID",
                    tavtValue: "TAVT Value",
                    tavtPercentage: "TAVT Percentage",
                    tavtDealerPenalty: "TAVT Dealer Penalty",
                    tavtDealerPenaltyPercentage: "TAVT Dealer Penalty Percentage",
                    titleFees: "Title Fees",
                    titleLatePenalty: "Title Late Penalty",
                    ourFees: "Our fees"
                };

                for (let key in latestTavtForm) {
                    if (tavtForm[key] != latestTavtForm[key] && fieldMappings[key]) {
                        const fieldName = fieldMappings[key] || key;
                        let oldValue = tavtForm[key];
                        let newValue = latestTavtForm[key];
                        // other Ids
                        changes.push({ fieldName, oldValue, newValue });
                    }
                }

                if ('otherFees' in latestTavtForm && 'otherFees' in tavtForm) {
                    const oldFees = tavtForm.otherFees || [];
                    const newFees = latestTavtForm.otherFees || [];

                    const addedFees = newFees.filter(newFee => !oldFees.some(oldFee => oldFee.id === newFee.id));
                    const removedFees = oldFees.filter(oldFee => !newFees.some(newFee => newFee.id === oldFee.id));
                    const updatedFees = newFees.filter(newFee => {
                        const oldFee = oldFees.find(oldFee => oldFee.id === newFee.id);
                        return oldFee && JSON.stringify(oldFee) !== JSON.stringify(newFee);
                    });
                    addedFees.forEach(newFee => {
                        changes.push({
                            fieldName: newFee?.taxableMaster?.name,
                            oldValue: null,
                            newValue: newFee.price
                        });
                    });
                    removedFees.forEach(oldFee => {
                        changes.push({
                            fieldName: oldFees?.name,
                            oldValue: oldFee,
                            newValue: null
                        });
                    });
                    updatedFees.forEach(newFee => {
                        const oldFee = oldFees.find(oldFee => oldFee.id === newFee.id);
                        changes.push({
                            fieldName: newFee?.taxableMaster?.name,
                            oldValue: oldFee.price,
                            newValue: newFee.price
                        });
                    });
                }
                if (changes.length > 0) {
                    data = changes.map(change => ({
                        userId: userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: tavtForm.ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: !isSummary ? DataEntryFormType.TAVT_FORM_ACTIVITY : DataEntryFormType.SUMMARY_TAVT_FORM__ACTIVITY
                    }));
                }
            }
            if (data !== undefined) {
                this.activityLogService.addActivityLog(data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            }

            //assign ticket to logged in user is not a assignee
            await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(tavtForm.ticketId, userId);

            return latestTavtForm;
        } catch (error) {
            throwException(error);
        }
    }

    async getTavtForm(ticketId: number) {
        try {
            const data: any = await this.manager.createQueryBuilder(TavtForm, "tavtForm")
                .leftJoinAndSelect("tavtForm.otherFees", "otherFees", "otherFees.isDeleted=false")
                .leftJoinAndSelect("otherFees.taxableMaster", "taxableMaster")
                .leftJoinAndSelect("tavtForm.ticket", "ticket")
                .leftJoinAndSelect("tavtForm.tavtTaxExemptionMaster", "tavtTaxExemptionMaster", "tavtTaxExemptionMaster.isDeleted=false")
                .leftJoinAndSelect("ticket.tradeInInfo", "tradeInInfo", "tradeInInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .leftJoinAndSelect("customer.transactionTypes", "customerTransactionTypes", "customerTransactionTypes.transactionTypesId = basicInfo.transactionTypeId")
                .leftJoinAndSelect("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted=false")
                .leftJoinAndSelect("ticket.registrationInfo", "registrationInfo")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.createdBy IS NOT NULL AND is_lessor=false")
                .leftJoinAndSelect('buyerInfo.county', 'county')
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo", "vinInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.fmvMasters", "fmvMasters", "fmvMasters.effectiveYear = EXTRACT(YEAR FROM ticket.startDate) AND fmvMasters.isDeleted=false AND fmvMasters.year = vinInfo.year")
                .select(["tavtForm", "otherFees.otherFeesId", "otherFees.price", "otherFees.id",
                    "taxableMaster.id", "taxableMaster.name", "taxableMaster.price", "taxableMaster.isTaxable",
                    "tavtForm.checkCount",
                    "transactionType.transactionCode",
                    "transactionType.id",
                    "transactionType.price",
                    "sellerInfo.id", "sellerInfo.isDealership",
                    "basicInfo.transactionTypeId", "basicInfo.isTitle", "basicInfo.isRegistration",
                    "buyerInfo.dob", "buyerInfo.name", "buyerInfo.isLessee", "county.id", "county.code", "buyerInfo.district", "buyerInfo.type",
                    "vinInfo.id", "vinInfo.type",
                    "ticket.id", "ticket.startDate", "ticket.purchaseDate", "tradeInInfo.tradeInAllowance", "tradeInInfo.id", "ticket.isStateTransfer",
                    "registrationInfo.initialTotalCost",
                    "customer.id",
                    "customerTransactionTypes.id",
                    "customerTransactionTypes.price",
                    "tavtTaxExemptionMaster.id", "tavtTaxExemptionMaster.exemptionType", "tavtTaxExemptionMaster.exemption", "tavtTaxExemptionMaster.rate",
                    "fmvMasters.price", "fmvMasters.id"
                ])
                .where(`(tavtForm.ticketId = :ticketId)`, { ticketId })
                .orderBy('tradeInInfo.id', 'ASC')
                .addOrderBy('otherFees.id', 'ASC')
                .addOrderBy("fmvMasters.id", "DESC")
                .getOne();
            if (data?.arrivalDate && !data.tavtDealerPenaltyPercentage) {
                data.tavtDealerPenaltyPercentage = this.getTavtPenalty(data).tavtDealerPenaltyPercentage.penalty;
            }

            return data;
        } catch (error) {
            throwException(error);
        }
    }

    async taxableCostCalc(data) {
        const toNumber = (str) => parseFloat(str) || 0;
        let {
            salesPrice = 0,
            accessories = 0,
            administrationFees = 0,
            dealerHandling = 0,
            deliveryFees = 0,
            documentationFees = 0,
            shippingHandlingFees = 0,
            otherFees = [],
            rebates = 0,
            discount = 0,
            ticket,
            tavtPercentage = 0,
            tavtDealerPenaltyPercentage = 0,
            salesTaxPercentage = 0,
            valoremCalc = [],
            isSales,
            agreedUponValue,
            amortized,
            depreciation,
            downPayment,
            titleFees,
            titleLatePenalty

        } = data || {};
        // Initialize an object to store the detailed calculation
        const calculationDetails: any = {
            total: 0,
            salesPrice: { type: 'add', val: toNumber(salesPrice) },
            accessories: { type: 'add', val: toNumber(accessories) },
            administrationFees: { type: 'add', val: toNumber(administrationFees) },
            dealerHandling: { type: 'add', val: toNumber(dealerHandling) },
            deliveryFees: { type: 'add', val: toNumber(deliveryFees) },
            documentationFees: { type: 'add', val: toNumber(documentationFees) },
            shippingHandlingFees: { type: 'add', val: toNumber(shippingHandlingFees) },
            rebates: { type: 'sub', val: toNumber(rebates) },
            discount: { type: 'sub', val: toNumber(discount) },
            otherFees: [],
            tradeInInfo: [],
        };
        //Add FMV if FMV price greater than sales price
        if (data?.ticket?.isStateTransfer && data?.ticket?.basicInfo?.transactionType?.transactionCode == "ST" && toNumber(data?.ticket?.fmvMasters[0]?.price) > calculationDetails?.salesPrice?.val) {
            calculationDetails.fmvRate = { type: 'add', val: toNumber(data?.ticket?.fmvMasters[0]?.price) }
            calculationDetails.salesPrice = { type: 'add', val: toNumber(0) }
        } else {
            calculationDetails.fmvRate = { type: 'add', val: toNumber(0) }
        }
        // Calculate the total from the basic fees
        let { total, fairValue } = Object.values(calculationDetails).reduce((acc: { total: number, fairValue: number }, item: any) => {
            if (item.type === 'add') {
                acc.total += item.val;
                acc.fairValue += item.val;
            } else if (item.type === 'sub') {
                acc.total -= item.val;
            }
            return acc;
        }, { total: 0, fairValue: 0 });

        // Add other fees if they are taxable and store details
        if (otherFees.length > 0) {
            otherFees.forEach(fee => {
                if (fee.taxableMaster.isTaxable) {
                    const feeValue = toNumber(fee.price);
                    calculationDetails.otherFees.push({ type: 'add', val: feeValue, description: fee.taxableMaster.name });
                    total += feeValue;
                    fairValue += feeValue
                }
            });
        }

        // Subtract trade-in allowances from the total and store details
        if (ticket?.tradeInInfo.length > 0) {
            ticket.tradeInInfo.forEach(tradeIn => {
                const tradeInValue = toNumber(tradeIn.tradeInAllowance);
                calculationDetails.tradeInInfo.push({ type: 'sub', val: tradeInValue });
                total -= tradeInValue;
            });
        }

        calculationDetails.total = parseFloat(total.toFixed(2));
        if (isSales) {
            calculationDetails.salesTaxValue = parseFloat(((salesTaxPercentage / 100) * calculationDetails.total).toFixed(2));
        } else {
            if (agreedUponValue) {
                calculationDetails.total = agreedUponValue;
            } else if (amortized || downPayment || depreciation) {
                calculationDetails.total = toNumber(amortized) + toNumber(downPayment) + toNumber(depreciation) + (toNumber(fairValue) - toNumber(salesPrice));
            }
            calculationDetails.tavtValue = parseFloat(((tavtPercentage / 100) * calculationDetails.total).toFixed(2));
            calculationDetails.tavtDealerPenalty = parseFloat(((tavtDealerPenaltyPercentage / 100) * calculationDetails.tavtValue).toFixed(2));
        }

        if (ticket?.vinInfo?.type?.toLowerCase() == "trailer") {
            if (ticket?.startDate && ticket?.purchaseDate && ticket?.buyerInfo.length > 0) {
                const [buyerInfo] = ticket.buyerInfo;
                const { expirationDate: dob } = getExpirationDate(ticket);
                if (dob && buyerInfo?.district) {
                    // Calculate Valorem Tax and Penalty

                    // Get Milage Rate
                    const rate = await this.getMilageRate(ticket?.startDate, buyerInfo.district, buyerInfo?.county?.id);
                    const millRate = parseFloat(rate?.yearlyRates?.[0]?.millRate ?? '0') / 1000;

                    // Calculate Valorem Value
                    const valoremValue = parseFloat(((fairValue * 0.4) * millRate).toFixed(2));

                    // Process each year's valorem and penalty
                    if (valoremCalc?.length > 0) {
                        const processedData = valoremCalc.map((item) => {
                            const yearData = { ...item };
                            yearData.valorem = valoremValue;

                            // If penalty is present, calculate penalty value as a percentage of valorem
                            if (item.penalty > 0) {
                                yearData.penaltyValue = parseFloat(((valoremValue * item.penalty) / 100).toFixed(4));
                            }

                            return yearData;
                        });
                        calculationDetails.valoremCalc = processedData;
                    }

                }
            }
        }
        calculationDetails.subTotalCalc = {
            tavtTotal: (calculationDetails?.tavtValue || 0) + (calculationDetails?.tavtDealerPenalty || 0),
            titleTotal: data?.ticket.basicInfo?.isTitle ? (toNumber(titleLatePenalty) + toNumber(titleFees)) : 0,
            regTotal: data?.ticket.basicInfo?.isRegistration ? (toNumber(data.ticket?.registrationInfo?.initialTotalCost)) : 0,
            salesTaxTotal: (calculationDetails?.salesTaxValue || 0),
            serviceFee: toNumber(data.ticket?.basicInfo?.customer?.transactionTypes[0]?.price ||
                data.ticket?.basicInfo?.transactionType?.price ||
                0),
            valoremCalc: toNumber(calculationDetails?.valoremCalc?.reduce((acc, { valorem, penaltyValue }) => acc + valorem + penaltyValue, 0).toFixed(2) || 0)
        }
        calculationDetails.subTotalCalc.finalTotal = Object.values(calculationDetails.subTotalCalc).reduce((acc: any, value) => acc + value, 0);
        return calculationDetails;
    }

    async getCalcInfo(ticketId: number) {
        try {
            const data: any = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .leftJoinAndSelect("customer.transactionTypes", "customerTransactionTypes", "customerTransactionTypes.transactionTypesId = basicInfo.transactionTypeId")
                .leftJoinAndSelect("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted=false")
                .leftJoinAndSelect("ticket.tavtForm", "tavtForm")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.createdBy IS NOT NULL AND is_lessor=false")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect(
                    "county.salesTax",
                    "salesTax",
                    `salesTax.id = (
                        SELECT st.id FROM master.sales_tax_master st
                        LEFT JOIN county.county_milage c ON c.id = st.city_id
                        WHERE st.county_id = county.id
                          AND (LOWER(c.district_name) = LOWER(buyerInfo.district) OR c.district_name IS NULL)
                        ORDER BY 
                          CASE WHEN LOWER(c.district_name) = LOWER(buyerInfo.district) THEN 1 ELSE 2 END
                        LIMIT 1
                    )`
                )
                .leftJoinAndSelect("ticket.tradeInInfo", "tradeInInfo", "tradeInInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo", "vinInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.registrationInfo", "regInfo", "basicInfo.isRegistration=true")
                .leftJoinAndSelect("ticket.fmvMasters", "fmvMasters", "fmvMasters.effectiveYear = EXTRACT(YEAR FROM ticket.startDate) AND fmvMasters.isDeleted=false AND fmvMasters.year = vinInfo.year")
                .select([
                    "ticket.id",
                    "ticket.purchaseDate",
                    "ticket.startDate",
                    "ticket.isStateTransfer",
                    "tavtForm.arrivalDate",
                    "sellerInfo.id",
                    "sellerInfo.isDealership",
                    "sellerInfo.sellerType",
                    "tradeInInfo.tradeInAllowance",
                    "tradeInInfo.id",
                    "buyerInfo.id",
                    "buyerInfo.countyId",
                    "buyerInfo.dob",
                    "buyerInfo.name",
                    "buyerInfo.isLessee",
                    "county.id",
                    "county.code",
                    "buyerInfo.district",
                    "buyerInfo.type",
                    "salesTax.rate",
                    "basicInfo.isTitle",
                    "basicInfo.isRegistration",
                    "transactionType.transactionCode",
                    "transactionType.id",
                    "transactionType.price",
                    "customer.id",
                    "customerTransactionTypes.id",
                    "customerTransactionTypes.price",
                    "regInfo.costCalc",
                    "fmvMasters.price",
                    "fmvMasters.id",
                    "vinInfo.id",
                    "vinInfo.type"
                ])
                .where(`(ticket.id = :ticketId)`, { ticketId })
                .orderBy("buyerInfo.updatedAt", "DESC")
                .addOrderBy("tradeInInfo.id", "ASC")
                .addOrderBy("fmvMasters.id", "DESC")
                .getOne();
            const taxes = this.getTavtPenalty(data);
            data.titleLatePenalty = taxes.titleLatePenalty;
            data.tavtDealerPenaltyPercentage = taxes.tavtDealerPenaltyPercentage;
            data.tavtPercentage = await this.getTavtPercentage(data);
            data.valoremFlag = this.getValoremTax(data);
            return data
        } catch (error) {
            throwException(error);
        }
    }

    getTavtPenalty(data) {
        const startDate = data?.startDate || data?.ticket?.startDate;
        const isDealer = data?.sellerInfo ? data?.sellerInfo[0]?.isDealership : data?.ticket?.sellerInfo[0]?.isDealership;
        let arrivalDate = null;
        const purchaseDate = data?.ticket?.purchaseDate || data?.purchaseDate;
        const seller = data?.sellerInfo || data?.ticket?.sellerInfo;
        const stateTransfer = data?.basicInfo?.transactionType?.transactionCode == "ST" || data?.ticket?.basicInfo?.transactionType?.transactionCode == "ST";
        if (stateTransfer) {
            arrivalDate = data?.tavtForm?.arrivalDate || data?.arrivalDate
        }
        const referenceDate = arrivalDate || purchaseDate;
        const daysDiff = moment(startDate).diff(moment(referenceDate), 'days');
        let penalty = null;
        let titlePenalty = null;
        if (daysDiff > 30) {
            titlePenalty = "10.00";
        }
        if (stateTransfer) {
            if (daysDiff > 90) {
                penalty = 11 + Math.ceil((daysDiff - 90) / 30);
            } else if (daysDiff > 60) {
                penalty = 11;
            } else if (daysDiff > 30) {
                penalty = 10;
            }
        }
        if (seller.length > 0 && isDealer) { // Dealer Penalty
            if (daysDiff > 90) {
                penalty = 10 + Math.ceil((daysDiff - 90) / 30) * 5;
            } else if (daysDiff > 60) {
                penalty = 10;
            } else if (daysDiff > 30) {
                penalty = 5;
            }
        } else if (seller.length > 0 && !isDealer) { // Casual Penalty
            if (daysDiff > 90) {
                penalty = 11 + Math.ceil((daysDiff - 90) / 30);
            } else if (daysDiff > 60) {
                penalty = 11;
            } else if (daysDiff > 30) {
                penalty = 10;
            }
        }
        return { tavtDealerPenaltyPercentage: { penalty, purchaseDate: referenceDate, processingDate: startDate, daysDiff }, titleLatePenalty: titlePenalty };
    }

    getValoremTax(ticket) {
        if (ticket?.startDate && ticket?.purchaseDate && ticket?.buyerInfo.length > 0) {
            const [buyerInfo] = ticket.buyerInfo;
            const { expirationDate: dob } = getExpirationDate(ticket);
            if (dob && buyerInfo?.district) {
                return this.calculateValoremTaxAndPenalty(ticket.startDate, dob, ticket.purchaseDate)
            }
        }
    }

    calculateValoremTaxAndPenalty(processingDate, dob, purchaseDate) {
        const processingDateMoment = moment(processingDate);
        const dobMoment = moment(dob);
        const purchaseDateMoment = moment(purchaseDate);

        const diffInDays = dobMoment.diff(processingDateMoment, 'days');
        const addValoremTax = diffInDays < 48;

        const purchaseYear = purchaseDateMoment.year();
        const dobYear = dobMoment.year();

        let result = [];

        for (let year = purchaseYear; year <= dobYear; year++) {
            let penalty = 0;

            if (year < dobYear || (year === dobYear && diffInDays < 0)) {
                penalty = valoremTacPenalty;
            }

            if (addValoremTax || penalty) {
                result.push({
                    year,
                    valorem: addValoremTax,
                    penalty: penalty
                });
            }
        }
        return result;
    }

    async getTavtPercentage(data) {
        const tavtMaster = await TavtTaxMaster.find();
        const currentTavt = tavtMaster.find(item => item.slug === 'AA');
        if (data?.basicInfo?.transactionType?.transactionCode == "ST") {
            if (data?.buyerInfo[0]?.type == BusinessTypeEnum.BUSINESS) {
                const county = await this.getCountyById(data?.buyerInfo[0]?.countyId)
                return { rate: county?.countyCheatSheet?.businessStateChange };
            } else if (data?.buyerInfo[0]?.type == BusinessTypeEnum.INDIVIDUAL) {
                return tavtMaster.find(item => item.slug === 'II')
            }
        }
        return currentTavt;
    }

    getCountyById(countyId: number) {
        return this.manager.createQueryBuilder(TitleCounties, 'county')
            .leftJoinAndSelect('county.countyCheatSheet', 'countyCheatSheet')
            .select(['county.id', 'countyCheatSheet.businessStateChange'])
            .where('county.id = :countyId', { countyId })
            .getOne();
    }

    async getMilageRate(startDate, districtName, countyId) {
        const currentYear = (new Date(startDate).getFullYear()) - 1;
        return this.manager
            .createQueryBuilder(CountyMilage, "countyMilage")
            .leftJoinAndSelect("countyMilage.county", "county")
            .leftJoinAndSelect("countyMilage.yearlyRates", "yearlyRates", "yearlyRates.year = :years", { years: currentYear })
            .select(["countyMilage.id", "yearlyRates.millRate", "county"])
            .where("(countyMilage.isActive = true AND countyMilage.districtName ILIKE :search AND county.id = :id)", { search: `%${districtName}%`, id: countyId })
            .getOne();
    }

    async getOtherField(id: number) {
        return this.manager.createQueryBuilder(TavtOtherFees, 'otherFees')
            .leftJoinAndSelect('otherFees.tavtForm', 'tavtForm')
            .leftJoinAndSelect('otherFees.taxableMaster', 'taxableMaster')
            .select([
                'otherFees.id',
                'otherFees.price',
                'tavtForm.ticketId',
                'taxableMaster.name'
            ])
            .where('otherFees.id = :id', { id })
            .andWhere('otherFees.isDeleted = :isDeleted', { isDeleted: false })
            .getOne();
    }

    async getSalesTaxList(query): Promise<{ salesTaxList: SalesTaxMaster[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(SalesTaxMaster, "salesTaxMaster")
                .leftJoinAndSelect("salesTaxMaster.county", "county")
                .leftJoinAndSelect("salesTaxMaster.city", "city")
                .select(["salesTaxMaster.id", "salesTaxMaster.rate", "salesTaxMaster.isActive", "salesTaxMaster.effectiveDate",
                    "salesTaxMaster.updatedAt", "salesTaxMaster.updatedBy", "county.name", "county.code", "county.id", "city.districtName", "city.id"])
                .where(`salesTaxMaster.effective_date=(select MAX("effective_date") from master.sales_tax_master stm )`)
            if (query) {
                listQuery.offset(parseInt(query.offset) * parseInt(query.limit));
                listQuery.limit(query.limit);
                listQuery.orderBy(query.orderBy, query.orderDir);
            }

            if (query?.search) {
                const searchPattern = `%${query.search}%`;
                listQuery.andWhere("(county.name ILIKE :search OR CAST(city.districtName AS TEXT) ILIKE :search OR CAST(salesTaxMaster.rate AS TEXT) LIKE :search)", {
                    search: searchPattern
                });
            }

            const salesTaxList = await listQuery.getManyAndCount();
            if (query) {
                query.count = salesTaxList[1];
            }
            return { salesTaxList: salesTaxList[0], page: query };
        } catch (error) {
            throwException(error);
        }
    }

    async getSalesTaxById(countyId: number, cityId: number): Promise<{ salesTaxList: any }> {
        try {
            const queryBuilder = this.manager.createQueryBuilder(SalesTaxMaster, "salesTaxMaster")
                .select(["salesTaxMaster.id", "salesTaxMaster.countyId", "salesTaxMaster.rate", "salesTaxMaster.effectiveDate", "salesTaxMaster.cityId"]);

            if (cityId && countyId) {
                queryBuilder.andWhere('salesTaxMaster.countyId = :countyId and salesTaxMaster.cityId = :cityId', { countyId, cityId });
            } else if (countyId) {
                queryBuilder.andWhere('salesTaxMaster.countyId = :countyId and salesTaxMaster.cityId IS NULL', { countyId });

            }

            const salesTaxList = await queryBuilder.getMany();

            const groupedData = {
                q1: salesTaxList.filter(tax => this.isDateInRange(tax.effectiveDate, '01-01', '03-31')),
                q2: salesTaxList.filter(tax => this.isDateInRange(tax.effectiveDate, '04-01', '06-30')),
                q3: salesTaxList.filter(tax => this.isDateInRange(tax.effectiveDate, '07-01', '09-30')),
                q4: salesTaxList.filter(tax => this.isDateInRange(tax.effectiveDate, '10-01', '12-31')),
            };

            return {
                salesTaxList: {
                    id: countyId,
                    countyId,
                    ...groupedData,
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    isDateInRange(date: Date, start: string, end: string): boolean {
        date = new Date(date);
        const year = date.getFullYear();
        const startDate = new Date(`${year}-${start}`);
        const endDate = new Date(`${year}-${end}`);
        return date >= startDate && date <= endDate;
    }


}

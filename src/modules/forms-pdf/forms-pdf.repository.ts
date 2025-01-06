import * as pdf from 'html-pdf-node';
import * as path from 'path';
import { promises as fs } from 'fs';
import { DataSource, In, Repository } from 'typeorm';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { FormsPdf } from 'src/shared/entity/forms-pdf.entity';
import { PdfStamp } from 'src/shared/entity/pdf-stamp.entity';
import { Tickets } from 'src/shared/entity/tickets.entity';
import { commonDeleteHandler, formatPrice, getTransactionReturnType, getValue } from 'src/shared/utility/common-function.methods';
import { SelectedFormsMapping } from 'src/shared/entity/selected-forms-mapping.entity';
import { join } from 'path';
import { documentPath } from 'src/config/common.config';
import moment from 'moment';
import { PDFDocument } from 'pdf-lib';
import * as libre from 'libreoffice-convert';
import { promisify } from 'util';
import * as xlsx from 'xlsx';
import { SelectedStampMapping } from 'src/shared/entity/selected-stamp-mapping.entity';
import { TransactionForms } from 'src/shared/entity/transaction-forms.entity';
import { SelectedDocsMapping } from 'src/shared/entity/selected-docs-mapping.entity';
import { TicketDocuments } from 'src/shared/entity/ticket-documents.entity';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import {
    formatClientAndUnit, formatCustomerIdMv1s, formatInvoiceAndCustomer, formatStamps,
    generateLesseeInfo, generateNoOfOwners, generateOdometerCode, assignDollarValue,
    renderLienDetails, renderLien, formatStringToHTML, generateDynamicHTMLRow,
    sumOfValues, subtractValues, sumAdditionalFees, calculateTotalTaxableValue,
    generateLesseeRender, formatNegative,
    renderCheckDetails
} from './helper/helper';
import { BusinessTypeEnum } from 'src/shared/enums/buyer-info.enum';
import { CountyCheatSheet } from 'src/shared/entity/county-cheetsheet.entity';

const convert = promisify(libre.convert);
@Injectable()
export class FormsPdfRepository extends Repository<FormsPdf> {
    constructor(readonly dataSource: DataSource) {
        super(FormsPdf, dataSource.createEntityManager());
    }
    async generatePdf(data): Promise<Buffer> {

        let bodyContent = '';
        const cssPath = join(process.cwd(), 'src/pdf-html/styles.css');
        const cssContent = await fs.readFile(cssPath, { encoding: 'utf8' });
        const formMappingsPath = join(process.cwd(), 'src/shared/helper/formMappings.json');
        const fileContent = await fs.readFile(formMappingsPath, 'utf8');
        const formMappings = JSON.parse(fileContent);
        const formIds: number[] = data.formIds;
        const mergedStampIds: number[] = Array.from(new Set(data.addOnStampId.concat(data.stampId)));

        const [stamps, addOnStamps] = await Promise.all([
            data.stampId.length ? PdfStamp.find({ where: { id: In(data.stampId) }, select: ["stamp"] }) : [],
            data.addOnStampId.length ? PdfStamp.find({ where: { id: In(data.addOnStampId), isAddOn: true }, select: ["stamp"] }) : [],
        ]);

        if (data.stampId.length > 0 && stamps.length !== data.stampId.length) {
            throw new NotFoundException(error.ERR_STAMP_NOT_FOUND);
        }

        if (data.addOnStampId.length > 0 && addOnStamps.length !== data.addOnStampId.length) {
            throw new NotFoundException(error.ERR_ADDON_STAMP_NOT_FOUND);
        }

        if (data.stampId.length > 2) {
            throw new BadRequestException(error.ERR_MAX_STAMP);
        }

        if (data.addOnStampId.length > 2) {
            throw new BadRequestException(error.ERR_MAX_ADD_ON_STAMP);
        }

        const formsData = await this.getFormsDetail(data.ticketId);
        const pdfPaths = await this.fetchDocumentPaths(data.docIds, data.ticketId);
        const forms = await FormsPdf.findBy({ id: In(formIds), isDeleted: false });

        await this.bulkInsertSelectedForms(
            this.dataSource,
            SelectedFormsMapping,
            data.formIds,
            data.ticketId,
            'ticketId',
            { formId: 'formId', ticketId: 'ticketId', isSelected: true },
            true  // true isForForms
        );

        await this.bulkInsertSelectedForms(
            this.dataSource,
            SelectedStampMapping,
            mergedStampIds,
            data.ticketId,
            'ticketId',
            { formId: 'stampId', ticketId: 'ticketId', isSelected: true },
            false  // false isForForms
        );

        await this.bulkInsertSelectedForms(
            this.dataSource,
            SelectedDocsMapping,
            data.docIds,
            data.ticketId,
            'ticketId',
            { formId: 'docId', ticketId: 'ticketId', isSelected: true },
            true  // false isForForms
        );
        const highWayImpact: any = formsData?.registrationInfo ? formsData?.registrationInfo?.costCalc : "";
        const plateTransfer: any = formsData?.registrationInfo?.plateTransfer;
        const tavtCalc: any = formsData?.tavtForm?.costCalc;
        const tavtValue = !formsData?.tavtForm?.isSales ? tavtCalc?.tavtValue : "";
        const tavtPenalty = !formsData?.tavtForm?.isSales ? getValue(tavtCalc?.tavtDealerPenalty) : "";
        const tavtPenaltyPercent = !formsData?.tavtForm?.isSales ? getValue(formsData?.tavtForm?.tavtDealerPenaltyPercentage) : "";

        const tavtTotal = !formsData?.tavtForm?.isSales ? tavtCalc?.subTotalCalc?.tavtTotal : "";

        const serviceFee = getValue(tavtCalc?.subTotalCalc?.serviceFee);
        const highWayImpactFee: string = formatPrice(highWayImpact?.highwayImpact50) ?? formatPrice(highWayImpact?.highwayImpact100);
        const salesTaxValue = formsData?.tavtForm?.isSales ? formsData?.tavtForm?.salesTaxValue : "";
        const eleVehicleFee = !plateTransfer ? getValue(highWayImpact?.alterFuelFee) : "";
        const plateTransFee = plateTransfer ? highWayImpact?.transferFee : "";
        const plateFee = !plateTransfer ? sumOfValues(formsData?.registrationInfo?.plate?.standardFee,
            formsData?.registrationInfo?.plate?.manufacturingFee, formsData?.registrationInfo?.plate?.annualSpecialFee) : "";
        const additionalFee = formsData?.tavtForm ? formsData?.tavtForm?.costCalc : "";
        const sumOfAdditionalFee: string = sumAdditionalFees(additionalFee);
        const sumOfRetailFees: any = sumOfValues(tavtCalc?.salesPrice?.val, sumOfAdditionalFee);
        const titleValue = formsData?.basicInfo?.isTitle ? formsData?.tavtForm?.titleFees : "";
        const titlePenalty = formsData?.basicInfo?.isTitle ? formsData?.tavtForm?.titleLatePenalty : "";
        const sumOfValorem: string = formsData?.tavtForm?.isSales ? tavtCalc?.subTotalCalc?.valoremCalc : "";
        const isBusiness = formsData?.owner?.[0]?.type || formsData?.lessors?.[0]?.type;
        const isSecBusiness = formsData?.owner?.[0]?.secondaryType || formsData?.lessors?.[0]?.secondaryType;
        const mailingFees = await this.getMailingFeesByCountyId(formsData?.owner[0]?.countyId ?? formsData?.lessees[0]?.countyId);
        const finalTotalFeesCountyValue = sumOfValues(
            tavtPenalty, tavtValue, salesTaxValue, titlePenalty, titleValue,
            mailingFees, plateFee, plateTransFee, sumOfValorem, highWayImpactFee, eleVehicleFee);
        const estimationFees = finalTotalFeesCountyValue.replace(/,/g, '');
        const totalService = sumOfValues(serviceFee, formsData?.billingInfo?.expressMailFees)
        const transactionReturn = await getTransactionReturnType(formsData?.billingInfo?.transactionReturnType);
        const sumOfTradeInAllow = sumOfValues(formsData?.tradeInInfo[0]?.tradeInAllowance, formsData?.tradeInInfo[1]?.tradeInAllowance,
            formsData?.tradeInInfo[2]?.tradeInAllowance, formsData?.tradeInInfo[3]?.tradeInAllowance);
        const finalTotalFeesStrCustomer = sumOfValues(tavtValue, tavtPenalty, titleValue, highWayImpactFee, salesTaxValue, serviceFee, plateFee,
            titlePenalty, eleVehicleFee, plateTransFee, mailingFees, sumOfValorem, formsData?.billingInfo?.expressMailFees);
        const gaTaxTotal = sumOfValues(tavtPenalty, tavtValue, salesTaxValue);

        const mappings: Record<any, any> = {
            '{{stamp}}': formatStamps(stamps, addOnStamps),
            '{{vin}}': getValue(formsData?.vinInfo?.vinNumber),
            '{{make}}': getValue(formsData?.vinInfo?.make).toUpperCase(),
            '{{colorBoth}}': formsData?.vinInfo?.primaryColor?.colorName && formsData?.vinInfo?.secondaryColor?.colorName
                ? `${formsData?.vinInfo?.primaryColor?.colorName.toUpperCase()}/${formsData?.vinInfo?.secondaryColor?.colorName.toUpperCase()}`
                : formsData?.vinInfo?.primaryColor?.colorName.toUpperCase() || formsData?.vinInfo?.secondaryColor?.colorName.toUpperCase(),
            '{{color}}': getValue(formsData?.vinInfo?.primaryColor?.colorName).toUpperCase(),
            '{{model}}': getValue(formsData?.vinInfo?.model).toUpperCase(),
            '{{cylinders}}': getValue(formsData?.vinInfo?.cylinders?.toString()),
            '{{bodyStyle}}': getValue(formsData?.vinInfo?.bodyStyle).toUpperCase(),
            '{{fuel}}': getValue(formsData?.vinInfo?.primaryFuelType).toUpperCase(),
            '{{gvw}}': getValue(formsData?.vinInfo?.gvw).toUpperCase(),
            '{{odometerReading}}': getValue(formsData?.titleInfo?.odometerReading?.toString()),
            '{{purchaseDate}}': formsData?.purchaseDate ? moment(formsData?.purchaseDate).format('MM-DD-YYYY') : "",
            '{{invoiceId}}': formatInvoiceAndCustomer(formsData?.invoiceId, formsData?.customer?.shortName).toUpperCase(),
            '{{dateReceived}}': formsData?.docReceivedDate ? moment(formsData?.docReceivedDate).format('MM/DD/YYYY') : "",
            '{{trackingId}}': getValue(formsData?.trackingId).toUpperCase(),
            '{{invoiceIdSingle}}': getValue(formsData?.invoiceId).toUpperCase(),
            '{{year}}': getValue(formsData?.vinInfo?.year?.toString()),
            '{{currentTitle}}': formsData?.titleInfo?.titleState?.code === "MSO" ? "MSO" : getValue(formsData?.titleInfo?.currentTitle).toUpperCase(),
            '{{currentTitleState}}': getValue(formsData?.titleInfo?.titleState?.name).toUpperCase(),
            '{{odometerCode}}': generateOdometerCode(formsData?.titleInfo?.odometerCode),
            '{{noOfOwners}}': generateNoOfOwners(formsData?.owner, formsData?.lessors),
            '{{ownerOrLessor}}': formsData?.owner?.length > 0 ? "Owner" : "Lessor",
            '{{bizOrInd}}': isBusiness === BusinessTypeEnum.BUSINESS ? `<span>${(getValue(formsData?.owner?.[0]?.name)).toUpperCase()}</span>
            <span>${(getValue(formsData?.lessors?.[0]?.name)).toUpperCase()}</span>` : "",
            '{{secBizOrInd}}': isSecBusiness === BusinessTypeEnum.BUSINESS ? `<span>${(getValue(formsData?.owner?.[0]?.secondaryName)).toUpperCase()}</span>
            <span> ${getValue(formsData?.lessors?.[0]?.secondaryName).toUpperCase()}</span>` : '',
            '{{secSign}}': isSecBusiness === BusinessTypeEnum.INDIVIDUAL ? `<span>${(getValue(formsData?.owner?.[0]?.secLastName)).toUpperCase()}</span>
            <span> ${getValue(formsData?.lessors?.[0]?.secFirstName).toUpperCase()}</span>
            <span>${(getValue(formsData?.owner?.[0]?.secFirstName)).toUpperCase()}</span>
            <span> ${getValue(formsData?.lessors?.[0]?.secLastName).toUpperCase()}</span>` : '',
            '{{sign}}': isSecBusiness === BusinessTypeEnum.INDIVIDUAL ? `<span>${(getValue(formsData?.owner?.[0]?.lastName)).toUpperCase()}</span>
            <span> ${getValue(formsData?.lessors?.[0]?.firstName).toUpperCase()}</span>
            <span>${(getValue(formsData?.owner?.[0]?.firstName)).toUpperCase()}</span>
            <span> ${getValue(formsData?.lessors?.[0]?.lastName).toUpperCase()}</span>` : '',
            '{{gaCountyRes1}}': getValue(formsData?.owner?.[0]?.county?.name).toUpperCase(),
            '{{gaCountyRes2}}': getValue(formsData?.lessees?.[0]?.county?.name).toUpperCase(),
            '{{firstNameOwner1}}': getValue(formsData?.owner?.[0]?.firstName).toUpperCase(),
            '{{middleNameOwner1}}': getValue(formsData?.owner?.[0]?.middleName).toUpperCase(),
            '{{lastNameOwner1}}': getValue(formsData?.owner?.[0]?.lastName).toUpperCase(),
            '{{firstOwnerLicense}}': getValue(formsData?.owner?.[0]?.license).toUpperCase(),
            '{{firstOwnerDob}}': formsData?.owner?.[0]?.dob ? moment(formsData?.owner?.[0]?.dob).format('MM-DD-YYYY') : "",
            '{{lessorDob}}': formsData?.lessors?.[0]?.dob ? moment(formsData?.lessors?.[0]?.dob).format('MM-DD-YYYY') : "",
            '{{firstOwnerPhone}}': getValue(formsData?.owner?.[0]?.phone),
            '{{ownerSuffix}}': getValue(formsData?.owner?.[0]?.suffix).toUpperCase(),
            '{{firstOwnerEmail}}': getValue(formsData?.owner?.[0]?.email).toUpperCase(),
            '{{firstOwnerBizName}}': getValue(formsData?.owner?.[0]?.name).toUpperCase(),
            '{{firstOwnerMailingAddress}}': getValue(formsData?.owner?.[0]?.mailingAddress).toUpperCase(),
            '{{firstOwnerAddress}}': getValue(formsData?.owner?.[0]?.address).toUpperCase(),
            '{{firstNameOwner2}}': getValue(formsData?.owner?.[0]?.secFirstName).toUpperCase(),
            '{{middleNameOwner2}}': getValue(formsData?.owner?.[0]?.secMiddleName).toUpperCase(),
            '{{lastNameOwner2}}': getValue(formsData?.owner?.[0]?.secLastName).toUpperCase(),
            '{{secondOwnerLicense}}': getValue(formsData?.owner?.[0]?.secLicense).toUpperCase(),
            '{{secondOwnerDob}}': formsData?.owner?.[0]?.secDob ? moment(formsData?.owner?.[0]?.secDob).format('MM-DD-YYYY') : '',
            '{{secLessorDob}}': formsData?.lessors?.[0]?.secDob ? moment(formsData?.lessors?.[0]?.secDob).format('MM-DD-YYYY') : '',
            '{{secondOwnerEmail}}': getValue(formsData?.owner?.[0]?.secondaryEmail).toUpperCase(),
            '{{secondOwnerMailingAddress}}': getValue(formsData?.owner?.[0]?.secMailingAddress).toUpperCase(),
            '{{secondOwnerAddress}}': getValue(formsData?.owner?.[0]?.secAddress).toUpperCase(),
            '{{secondOwnerPhone}}': getValue(formsData?.owner?.[0]?.secondaryPhone),
            '{{secondOwnerBizName}}': getValue(formsData?.owner?.[0]?.secondaryName).toUpperCase(),
            '{{secondOwnerSuffix}}': getValue(formsData?.owner?.[0]?.secSuffix).toUpperCase(),
            '{{fullName}}': isBusiness === BusinessTypeEnum.INDIVIDUAL ? `<span> ${getValue(formsData?.owner?.[0]?.firstName).toUpperCase()}</span>
            <span>${getValue(formsData?.owner?.[0]?.middleName).toUpperCase()}</span>
            <span>${getValue(formsData?.owner?.[0]?.lastName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.firstName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.middleName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.lastName).toUpperCase()}</span>` : "",
            '{{secFullName}}': isSecBusiness === BusinessTypeEnum.INDIVIDUAL ? `<span> ${getValue(formsData?.owner?.[0]?.secFirstName).toUpperCase()}</span>
            <span>${getValue(formsData?.owner?.[0]?.secMiddleName).toUpperCase()}</span>
            <span>${getValue(formsData?.owner?.[0]?.secLastName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.secFirstName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.secMiddleName).toUpperCase()}</span>
            <span>${getValue(formsData?.lessors?.[0]?.secLastName).toUpperCase()}</span>` : "",
            '{{sellerName}}': getValue(formsData?.sellerInfo[0]?.name).toUpperCase(),
            '{{sellerAddress}}': getValue(formsData?.sellerInfo[0]?.address).toUpperCase(),
            '{{salesTaxId}}': formatStringToHTML(getValue(formsData?.sellerInfo[0]?.salesTaxId), 9, 'span', 'width:18px;'),
            '{{dealerID}}': formatStringToHTML(getValue(formsData?.sellerInfo[0]?.sellerId), 12, 'span', 'width:18px;'),
            '{{lesseeLicense}}': formsData?.lessees?.[0]?.license && formsData?.lessees?.[0]?.secLicense
                ? `${formsData?.lessees?.[0]?.license} | ${formsData?.lessees?.[0]?.secLicense}`
                : formsData?.lessees?.[0]?.license || formsData?.lessees?.[0]?.secLicense,
            '{{lesseeLicenseMv7}}': getValue(formsData?.lessees?.[0]?.license),
            '{{lesseeFirstName}}': getValue(formsData?.lessees?.[0]?.firstName).toUpperCase(),
            '{{lesseeMiddleName}}': getValue(formsData?.lessees?.[0]?.middleName).toUpperCase(),
            '{{lesseeLastName}}': getValue(formsData?.lessees?.[0]?.lastName).toUpperCase(),
            '{{lesseeName}}': getValue(formsData?.lessees?.[0]?.name).toUpperCase(),
            '{{leasedVehicle}}': formsData?.owner?.length > 0
                ? '<span class="absolute checkbox checked" style="left:0; top: 0;"></span><span class="absolute checkbox" style="right:0; top: 0;"></span>'
                : '<span class="absolute checkbox" style="left:0; top: 0;"></span><span class="absolute checkbox checked" style="right:0; top: 0;"></span>',
            '{{lesseePhoneMv7}}': getValue(formsData?.lessees?.[0]?.phone),
            '{{lesseeCounty}}': formsData?.lessees?.[0]?.county?.name && formsData?.lessees?.[0]?.secCounty?.name
                ? `${formsData?.lessees?.[0]?.county?.name.toUpperCase()} | ${formsData?.lessees?.[0]?.secCounty?.name.toUpperCase()}`
                : formsData?.lessees?.[0]?.county?.name.toUpperCase() || formsData?.lessees?.[0]?.secCounty?.name.toUpperCase(),
            '{{lesseePhone}}': formsData?.lessees?.[0]?.phone && formsData?.lessees?.[0]?.secondaryPhone
                ? `${formsData?.lessees?.[0]?.phone} | ${formsData?.lessees?.[0]?.secondaryPhone}`
                : formsData?.lessees?.[0]?.phone || formsData?.lessees?.[0]?.secondaryPhone,
            '{{MailingAddress}}': getValue(formsData?.lessees?.[0]?.mailingAddress).toUpperCase(),
            '{{mv7secondLesseeLicense}}': getValue(formsData?.lessees?.[0]?.secLicense),
            '{{secondLesseeFirstName}}': getValue(formsData?.lessees?.[0]?.secFirstName).toUpperCase(),
            '{{lesseeRender}}': generateLesseeRender(formsData),
            '{{lesseeAddress}}': getValue(formsData?.lessees?.[0]?.address).toUpperCase(),
            '{{secondLesseeFirstNameSplit}}': generateLesseeInfo(formsData?.lessees),
            '{{secondLesseeMiddleName}}': getValue(formsData?.lessees?.[0]?.secMiddleName).toUpperCase(),
            '{{secondLesseeLastName}}': getValue(formsData?.lessees?.[0]?.secLastName).toUpperCase(),
            '{{secondLesseeName}}': getValue(formsData?.lessees?.[0]?.secondaryName).toUpperCase(),
            '{{secondLesseeAddress}}': getValue(formsData?.lessees?.[0]?.secAddress).toUpperCase(),
            '{{secondLesseeMailingAddress}}': getValue(formsData?.lessees?.[0]?.secMailingAddress).toUpperCase(),
            '{{secondLesseePhoneMv7}}': getValue(formsData?.lessees?.[0]?.secondaryPhone),
            '{{lessorFirstName}}': getValue(formsData?.lessors?.[0]?.firstName).toUpperCase(),
            '{{lessorMiddleName}}': getValue(formsData?.lessors?.[0]?.middleName).toUpperCase(),
            '{{lessorLastName}}': getValue(formsData?.lessors?.[0]?.lastName).toUpperCase(),
            '{{lessorName}}': getValue(formsData?.lessors?.[0]?.name).toUpperCase(),
            '{{lessorAddress}}': getValue(formsData?.lessors?.[0]?.address).toUpperCase(),
            '{{lessorSuffix}}': getValue(formsData?.lessors?.[0]?.suffix).toUpperCase(),
            '{{lessorPhone}}': getValue(formsData?.lessors?.[0]?.phone),
            '{{secLessorPhone}}': getValue(formsData?.lessors?.[0]?.secondaryPhone),
            '{{lessorMailingAddress}}': getValue(formsData?.lessors?.[0]?.mailingAddress).toUpperCase(),
            '{{secLessorFirstName}}': getValue(formsData?.lessors?.[0]?.secFirstName).toUpperCase(),
            '{{secLessorMiddleName}}': getValue(formsData?.lessors?.[0]?.secMiddleName).toUpperCase(),
            '{{secLessorLastName}}': getValue(formsData?.lessors?.[0]?.secLastName).toUpperCase(),
            '{{secLessorName}}': getValue(formsData?.lessors?.[0]?.secondaryName).toUpperCase(),
            '{{lessorLicense}}': getValue(formsData?.lessors?.[0]?.license).toUpperCase(),
            '{{lessorEmail}}': getValue(formsData?.lessors?.[0]?.email).toUpperCase(),
            '{{secLessorLicense}}': getValue(formsData?.lessors?.[0]?.secLicense).toUpperCase(),
            '{{secLessorSuffix}}': getValue(formsData?.lessors?.[0]?.secSuffix).toUpperCase(),
            '{{secLessorMailingAdd}}': getValue(formsData?.lessors?.[0]?.secMailingAddress).toUpperCase(),
            '{{secLessorAddress}}': getValue(formsData?.lessors?.[0]?.secAddress).toUpperCase(),
            '{{hireNot}}': formsData?.registrationInfo?.isForHire
                ? '<span class="absolute checkbox checked" style="left:0; top: 0;"></span><span class="absolute checkbox" style="right:0; top: 0;"></span>'
                : '<span class="absolute checkbox" style="left:0; top: 0;"></span><span class="absolute checkbox checked" style="right:0; top: 0;"></span>',
            '{{stateTransfer}}': formsData?.isStateTransfer
                ? '<span class="absolute checkbox checked" style="left:0; top: 0;"></span><span class="absolute checkbox" style="right:0; top: 0;"></span>'
                : '<span class="absolute checkbox" style="left:0; top: 0;"></span><span class="absolute checkbox checked" style="right:0; top: 0;"></span>',
            '{{regInfoMailingAdd}}': formsData?.registrationInfo?.mailingAddress ? `<p><strong>Temp Mailing Address - ${formsData?.registrationInfo?.mailingAddress.toUpperCase()}</strong></p>` : '',
            '{{lienFirstName}}': getValue(formsData?.lienInfo[0]?.firstName).toUpperCase(),
            '{{lienLastName}}': getValue(formsData?.lienInfo[0]?.lastName).toUpperCase(),
            '{{lienMiddleName}}': getValue(formsData?.lienInfo[0]?.middleName).toUpperCase(),
            '{{lienAddress}}': getValue(formsData?.lienInfo[0]?.address).toUpperCase(),
            '{{holderName}}': getValue(formsData?.lienInfo[0]?.holderName).toUpperCase(),
            '{{holderName2}}': getValue(formsData?.lienInfo[1]?.holderName).toUpperCase(),
            '{{lienHolderId}}': formatStringToHTML(getValue(formsData?.lienInfo[0]?.lien?.lienHolderId), 12, 'span', 'width:18px;'),
            '{{secLienFirstName}}': getValue(formsData?.lienInfo[1]?.firstName).toUpperCase(),
            '{{secLienLastName}}': getValue(formsData?.lienInfo[1]?.lastName).toUpperCase(),
            '{{secLienMiddleName}}': getValue(formsData?.lienInfo[1]?.middleName).toUpperCase(),
            '{{secLienAddress}}': getValue(formsData?.lienInfo[1]?.address).toUpperCase(),
            '{{isLien}}': renderLien(formsData?.lienInfo?.length > 0),
            '{{lienDetails}}': renderLienDetails(formsData?.lienInfo),
            '{{secLienHolderId}}': formatStringToHTML(getValue(formsData?.lienInfo[1]?.lien?.lienHolderId), 12, 'span', 'width:18px;'),
            '{{vinMv7}}': formatStringToHTML(getValue(formsData?.vinInfo?.vinNumber), 17, 'p', 'width:33.5px; text-align:center;'),
            '{{plateNumber}}': formatStringToHTML(getValue(formsData?.registrationInfo?.plateNumber), 7, 'p'),
            '{{plate}}': getValue(formsData?.registrationInfo?.plate?.categoryCode)
                ? `<p><strong>&lt;${getValue(formsData?.registrationInfo?.plate?.categoryCode).toUpperCase()}&gt;</strong></p>` : '',
            '{{suffix}}': getValue(formsData?.lessees?.[0]?.suffix).toUpperCase(),
            '{{secSuffix}}': getValue(formsData?.lessees?.[0]?.secSuffix).toUpperCase(),
            '{{todayDate}}': moment().format('MM-DD-YYYY'),
            '{{customerID}}': getValue(formsData?.basicInfo?.customer?.shortName).toUpperCase(),
            "{{transactionType}}": getValue(formsData?.basicInfo?.transactionType?.name) ? ` <span>&LT;${formsData?.basicInfo?.transactionType?.name}&GT;</span>` : ``,
            '{{customerName}}': getValue(formsData?.basicInfo?.customer?.name).toUpperCase(),
            '{{customerIdMv1s}}': formatCustomerIdMv1s(formsData?.basicInfo?.customer?.shortName).toUpperCase(),
            '{{client}}': formatClientAndUnit(formsData?.basicInfo?.client, formsData?.basicInfo?.unit),
            '{{date}}': moment().date().toString(),
            '{{month}}': (moment().month() + 1).toString(),
            '{{currentYear}}': moment().year().toString(),
            '{{currentTitleT16}}': formatStringToHTML(getValue(formsData?.titleInfo?.currentTitle), 19, 'p'),
            '{{insuranceCompanyName}}': getValue(formsData?.insuranceInfo?.companyName).toUpperCase(),
            "{{taxableValue}}": assignDollarValue(formatNegative(formsData?.tavtForm?.taxableValue)),
            '{{tavtPercentSingle}}': formatNegative(formsData?.tavtForm?.tavtPercentage),
            "{{tavtPercentage}}": generateDynamicHTMLRow({
                label: "TAVT",
                percentage: !formsData?.tavtForm?.isSales ? getValue(formsData?.tavtForm?.tavtPercentage) : "",
                value: formatNegative(tavtValue),
                trTag: "tr class='penalty-row'",
                tdTag: "td class='penalty-data'"
            }),
            "{{tavtValue}}": assignDollarValue(formatNegative(tavtValue)),
            "{{tavtTotal}}": assignDollarValue(formatNegative(tavtTotal)),
            "{{tavtDealerPenalty}}": assignDollarValue(formatNegative(tavtPenalty)),
            "{{tavtDealerPenaltyPer}}": formatNegative(tavtPenaltyPercent),
            "{{billingInfoAddress}}": formsData?.billingInfo?.address
                ? `<li style="font-weight: 700;"><span><b>Transaction Return: </b></span> 
               <span>${formsData?.billingInfo?.address}</span></li>`
                : '',
            "{{billingInfoReturn}}": transactionReturn
                ? `<li style="font-weight: 700;"><span><b>Transaction Return: </b></span> 
               <span>${transactionReturn}</span></li>`
                : '',
            "{{checkDeposit}}": renderCheckDetails(formsData?.billingInfoDeposits),
            "{{agreedUponValue}}": assignDollarValue(formatNegative(formsData?.tavtForm?.agreedUponValue)),
            "{{totlNetTaxAmt}}": subtractValues(formsData?.tavtForm?.agreedUponValue, formsData?.tradeInInfo[0]?.tradeInAllowance, formsData?.tradeInInfo[1]?.tradeInAllowance,
                formsData?.tradeInInfo[2]?.tradeInAllowance, formsData?.tradeInInfo[3]?.tradeInAllowance),
            "{{tavtDealerPenaltyPercent}}": generateDynamicHTMLRow({
                label: "TAVT Late Fees",
                percentage: formatNegative(tavtPenaltyPercent),
                value: formatNegative(tavtPenalty),
                trTag: "tr class='penalty-row'",
                tdTag: "td class='penalty-data'"
            }),
            "{{tavtSalesTaxPercent}}": generateDynamicHTMLRow({
                label: "Sales Tax",
                percentage: formsData?.tavtForm?.isSales ? formatNegative(formsData?.tavtForm?.salesTaxPercentage) : "",
                value: formatNegative(salesTaxValue),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{titleFeesDynamic}}": generateDynamicHTMLRow({
                label: "Title Fees",
                percentage: null,
                value: formatNegative(titleValue),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{lateTitleFees}}": generateDynamicHTMLRow({
                label: "Late Title Fees",
                percentage: null,
                value: formatNegative(titlePenalty),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{transPlateFee}}": generateDynamicHTMLRow({
                label: "Transfer Plate Fee",
                percentage: null,
                value: formatNegative(plateTransFee),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{renewal}}": generateDynamicHTMLRow({
                label: "Renewal",
                percentage: null,
                value: "0.00",
                trTag: "tr",
                tdTag: "td"
            }),
            "{{mailingFee}}": generateDynamicHTMLRow({
                label: "Mailing Fee",
                percentage: null,
                value: formatNegative(mailingFees),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{serviceFee}}": generateDynamicHTMLRow({
                label: "Our Service Fee",
                percentage: null,
                value: formatNegative(serviceFee),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{expressMailFee}}": generateDynamicHTMLRow({
                label: "Express Mail Fee",
                percentage: null,
                value: formatNegative(formsData?.billingInfo?.expressMailFees),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{expressMail}}": formsData?.billingInfo?.expressMailFees ? `<li style="font-weight: 700;"><span><b>Express Mail Fee: </b></span> 
            <span>${formatNegative(formsData?.billingInfo?.expressMailFees)}</span></li>` : '',
            "{{adVeloAndAdVelPen}}": generateDynamicHTMLRow({
                label: "Ad Valorem + Ad Valorem Penalty",
                percentage: null,
                value: formatNegative(sumOfValorem),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{plateFee}}": generateDynamicHTMLRow({
                label: "Plate Fee",
                percentage: null,
                value: formatNegative(plateFee),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{eleVehicleFee}}": generateDynamicHTMLRow({
                label: "Electric Vehicle Fee",
                percentage: null,
                value: formatNegative(eleVehicleFee),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{highwayImpactFee}}": generateDynamicHTMLRow({
                label: "High way Impact Fee",
                percentage: null,
                value: formatNegative(highWayImpactFee),
                trTag: "tr",
                tdTag: "td"
            }),
            '{{totalGATaxRaw}}': generateDynamicHTMLRow({
                label: "Total GA Tax",
                percentage: null,
                value: formatNegative(gaTaxTotal),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalTitleValueRaw}}": generateDynamicHTMLRow({
                label: "Total Title Value",
                percentage: null,
                value: sumOfValues(titlePenalty, titleValue),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalLicenseValueRaw}}": generateDynamicHTMLRow({
                label: "Total License Value",
                percentage: null,
                value: sumOfValues(mailingFees, plateFee, plateTransFee, sumOfValorem, highWayImpactFee, eleVehicleFee),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{finalTotalFeesCounty}}": generateDynamicHTMLRow({
                label: "Final Total",
                percentage: null,
                value: formatNegative(finalTotalFeesCountyValue),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{finalTotalFeesCountySingle}}": assignDollarValue(formatNegative(finalTotalFeesCountyValue)),
            "{{totalLicenseValue}}": sumOfValues(plateFee, plateTransFee, mailingFees, sumOfValorem, highWayImpactFee, eleVehicleFee),
            "{{totalTitleValue}}": sumOfValues(titlePenalty, titleValue),
            '{{totalGATax}}': formatNegative(gaTaxTotal),
            '{{totalTaxableValue}}': calculateTotalTaxableValue({
                salesPrice: sumOfRetailFees,
                discount: tavtCalc?.discount?.val,
                rebates: tavtCalc?.rebates?.val,
                tradeInAllowances: [
                    formsData?.tradeInInfo?.[0]?.tradeInAllowance,
                    formsData?.tradeInInfo?.[1]?.tradeInAllowance,
                    formsData?.tradeInInfo?.[2]?.tradeInAllowance,
                    formsData?.tradeInInfo?.[3]?.tradeInAllowance
                ]
            }),
            "{{titleFees}}": assignDollarValue(titleValue),
            "{{salesPrice}}": generateDynamicHTMLRow({
                label: "Sales Price",
                percentage: null,
                value: formatNegative(tavtCalc?.salesPrice?.val),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{additionalPrice}}": generateDynamicHTMLRow({
                label: "Additional Fees",
                percentage: null,
                value: formatNegative(sumOfAdditionalFee),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{rebates}}": generateDynamicHTMLRow({
                label: "Rebates",
                percentage: null,
                value: formatNegative(tavtCalc?.rebates?.val),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{discountRaw}}": generateDynamicHTMLRow({
                label: "Cash Discount",
                percentage: null,
                value: formatNegative(tavtCalc?.discount?.val),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{totalTaxableValueRaw}}": generateDynamicHTMLRow({
                label: "Total Taxable Value",
                percentage: null,
                value: calculateTotalTaxableValue({
                    salesPrice: sumOfRetailFees,
                    discount: tavtCalc?.discount?.val,
                    rebates: tavtCalc?.rebates?.val,
                    tradeInAllowances: [
                        formsData?.tradeInInfo?.[0]?.tradeInAllowance,
                        formsData?.tradeInInfo?.[1]?.tradeInAllowance,
                        formsData?.tradeInInfo?.[2]?.tradeInAllowance,
                        formsData?.tradeInInfo?.[3]?.tradeInAllowance
                    ]
                }),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalRetSellValueRaw}}": generateDynamicHTMLRow({
                label: "Total Retail Selling Value",
                percentage: null,
                value: formatNegative(sumOfRetailFees),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalServiceSection}}": generateDynamicHTMLRow({
                label: "Service Total",
                percentage: null,
                value: formatNegative(totalService),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalFeesStrCustomer}}": generateDynamicHTMLRow({
                label: "Final Total",
                percentage: null,
                value: formatNegative(finalTotalFeesStrCustomer),
                trTag: "tr class='finalAmount'",
                tdTag: "th"
            }),
            "{{totalTradeIn}}": generateDynamicHTMLRow({
                label: "Trade in",
                percentage: null,
                value: formatNegative(sumOfTradeInAllow),
                trTag: "tr",
                tdTag: "td"
            }),
            "{{totalTradeInValue}}": formatNegative(sumOfTradeInAllow),
            "{{discount}}": assignDollarValue(formatNegative(tavtCalc?.discount?.val)),
            "{{titleLatePenalty}}": assignDollarValue(formatNegative(titlePenalty)),
            "{{runnerNote}}": getValue(formsData?.billingInfo?.runnerNote),
            "{{customerNote}}": getValue(formsData?.basicInfo?.customer?.customerNote),
            "{{licenseFees}}": assignDollarValue(formatNegative(formsData?.registrationInfo?.initialTotalCost))
        };

        await Tickets.createQueryBuilder()
            .update()
            .set({ estimationFees })
            .where(`id = :ticketId`, { ticketId: data.ticketId })
            .execute();

        const replacePlaceholders = (content: string, mappings: Record<string, string>): string => {
            return content.replace(/{{\w+}}/g, (match) => mappings[match] || '');
        };
        const orderedForms = formIds.map(id => forms.find(form => form.id === id));
        // Read HTML parallel
        const htmlContents = await Promise.all(orderedForms.map(async form => {
            if (form && formMappings[form.code]) {
                const filePath = join(process.cwd(), `src/pdf-html/${formMappings[form.code]}`);
                let content = await fs.readFile(filePath, 'utf8');
                return replacePlaceholders(content, mappings);
            }
            return null;
        }));

        //forms correct order & bodyContent
        bodyContent = htmlContents
            .filter(content => content) // Remove null
            .map(content => `<div class="form-content">${content}</div>`)
            .join("");

        // Merge HTML create PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Tags & Titles PDF</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet" />
                    <style>${cssContent}</style>
                </head>
                <body>
                    ${bodyContent}
                </body>
            </html>
        `;

        const options = {
            format: 'A4',
            printBackground: true,
            timeout: 180000,
            headless: true
        };

        const generatedPdfBuffer = await pdf.generatePdf({ content: htmlContent }, options);
        if (!(generatedPdfBuffer instanceof Uint8Array || Buffer.isBuffer(generatedPdfBuffer))) {
            throw new Error("ERROR_MESSAGE");
        }

        const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png', '.docx', '.doc', '.xls', '.xlsx'];
        const pdfDoc = await PDFDocument.load(generatedPdfBuffer);
        await this.processAndMergeFiles(pdfPaths, allowedExtensions, pdfDoc, options); // function for merge files
        // Save & return merged PDF
        const mergedPdfBuffer = await pdfDoc.save();
        return Buffer.from(mergedPdfBuffer);
    }
    async fetchAllForms(filterDto, formShortCode): Promise<{ formsPdf: any[]; stampIds: any[]; addOnStampIds: any[]; docIds: any[], page: object }> {
        try {
            //fetch selected forms on ticketId
            const selectedFormsQuery = this.manager
                .createQueryBuilder(SelectedFormsMapping, "form")
                .leftJoinAndSelect("form.formsPdf", "formsPdf")
                .select(["form.id", "form.isSelected", "formsPdf.id", "formsPdf.formsName", "formsPdf.code", "formsPdf.description"])
                .where("form.ticketId = :ticketId", { ticketId: filterDto.ticketId })
                .orderBy("form.id", "ASC");

            const selectedForms = await selectedFormsQuery.getMany();
            const selectedFormIds = selectedForms.map(form => form.formsPdf.id);

            // fetch all forms
            const listQuery = this.manager
                .createQueryBuilder(FormsPdf, "formsPdf")
                .select(["formsPdf.id", "formsPdf.formsName", "formsPdf.isRequired", "formsPdf.isDeleted",
                    "formsPdf.description", "formsPdf.code"
                ])
                .where("formsPdf.isDeleted = false");

            // fetch stamp data
            const stampQuery = this.manager
                .createQueryBuilder(SelectedStampMapping, "selectedStamp")
                .leftJoinAndSelect("selectedStamp.stamp", "stamp")
                .select(["selectedStamp.id", "selectedStamp.stampId", "stamp.id", "stamp.isAddOn"])
                .where("selectedStamp.ticketId = :ticketId", { ticketId: filterDto.ticketId })
                .orderBy("selectedStamp.id", "ASC");

            const docQuery = this.manager
                .createQueryBuilder(SelectedDocsMapping, "selectedDoc")
                .leftJoinAndSelect("selectedDoc.document", "doc")
                .select(["selectedDoc.docId", "selectedDoc.id", "selectedDoc.isSelected", "doc.isDeleted"])
                .where("selectedDoc.ticketId = :ticketId", { ticketId: filterDto.ticketId })
                .andWhere("doc.isDeleted = false")
                .orderBy("selectedDoc.id", "ASC");

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }
                listQuery.orderBy(`formsPdf.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const formsPdfData = await listQuery.getMany();
            const shortCodesSet = new Set(formShortCode.map(v => v.transactionForms_form_short_code));
            const formsPdf = formsPdfData.map(form => {
                return {
                    id: form.id,
                    isSelected: selectedFormIds.includes(form.id),
                    isRequired: shortCodesSet.has(form.code),
                    formsPdf: {
                        id: form.id,
                        formsName: form.formsName,
                        description: form.description,
                        code: form.code
                    }
                };
            }).sort((a, b) => {
                // Sort based on order IDs in selectedFormIds
                const indexA = selectedFormIds.indexOf(a.id);
                const indexB = selectedFormIds.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            if (filterDto) {
                filterDto.count = formsPdf.length;
            }

            const formStamp = await stampQuery.getManyAndCount();
            const docIds = await docQuery.getMany();
            const addOnStamp = [];
            const stampData = [];

            formStamp[0].forEach(({ stampId, stamp: { isAddOn } }) => {
                (isAddOn ? addOnStamp : stampData).push(stampId);
            });

            return { formsPdf, stampIds: stampData, addOnStampIds: addOnStamp, docIds: docIds, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchStampList(filterDto): Promise<{ pdfStamp: PdfStamp[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(PdfStamp, "pdfStamp")
                .select(["pdfStamp.id", "pdfStamp.stamp", "pdfStamp.isDeleted", "pdfStamp.isAddOn"])
                .where("(pdfStamp.isDeleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }

                if (filterDto.isAddOn) {
                    listQuery.andWhere('pdfStamp.isAddOn = :isAddOn', { isAddOn: filterDto.isAddOn });
                }
                listQuery.orderBy(`pdfStamp.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const pdfStampWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = pdfStampWithCount[1];
            }

            return { pdfStamp: pdfStampWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async addStamp(addStamp, user) {
        try {
            const existingStamp = await PdfStamp.findOne({ where: { stamp: addStamp.stamp, isDeleted: false } });

            if (existingStamp) {
                throw new ConflictException("ERR_STAMP_EXIST");
            }

            const stamp = new PdfStamp();
            stamp.stamp = addStamp.stamp;
            stamp.isAddOn = addStamp.isAddOn;
            stamp.createdBy = user.id;
            const res = await stamp.save();

            return { id: res.id, stamp: res.stamp, isDeleted: res.isDeleted, isAddOn: res.isAddOn };
        } catch (error) {
            throwException(error);
        }
    }

    async getFormsDetail(id) {
        try {
            const ticket = await this.manager.createQueryBuilder(Tickets, "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("vinInfo.primaryColor", "primaryColor")
                .leftJoinAndSelect("vinInfo.secondaryColor", "secondaryColor")
                .leftJoinAndSelect("ticket.customer", "ticketCustomer")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("ticket.titleInfo", "titleInfo")
                .leftJoinAndSelect("ticket.insuranceInfo", "insuranceInfo")
                .leftJoinAndSelect("titleInfo.titleState", "titleState")
                .leftJoinAndSelect("ticket.lienInfo", "lienInfo", "lienInfo.isDeleted = false")
                .leftJoinAndSelect("lienInfo.lien", "lien")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("basicInfo.customer", "customer")
                .leftJoinAndSelect("ticket.registrationInfo", "regInfo")
                .leftJoinAndSelect("regInfo.plate", "plate")
                .leftJoinAndSelect("ticket.tradeInInfo", "tradeInInfo", "tradeInInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.tavtForm", "tavtForm")
                .leftJoinAndSelect("ticket.sellerInfo", "sellerInfo", "sellerInfo.isDeleted = false")
                .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                .leftJoinAndSelect("buyerInfo.county", "county")
                .leftJoinAndSelect("buyerInfo.secCounty", "secCounty")
                .leftJoinAndSelect("ticket.billingInfo", "billingInfo")
                .leftJoinAndSelect("ticket.billingInfoDeposits", "billingInfoDeposits")
                .select(["ticket.invoiceId", "ticket.purchaseDate", "ticket.customerId", "ticketCustomer.shortName", "ticket.isStateTransfer", "ticket.dateReceived", "ticket.docReceivedDate", "ticket.trackingId", "vinInfo.vinNumber", "vinInfo.year", "vinInfo.make", "vinInfo.model",
                    "vinInfo.cylinders", "vinInfo.bodyStyle", "vinInfo.gvw", "vinInfo.primaryFuelType", "vinInfo.primaryColorId", "vinInfo.secondaryColorId",
                    "primaryColor.colorName", "secondaryColor.colorName", "titleInfo.id", "titleInfo.currentTitle", "titleInfo.odometerReading", "titleInfo.odometerCode", "titleInfo.stateId", "titleInfo.stateId",
                    "titleState.name", "titleState.code", "buyerInfo.id", "buyerInfo.countyId", "buyerInfo.secCountyId", "buyerInfo.isLessee", "buyerInfo.isOwner",
                    "county.name", "secCounty.name", "buyerInfo.purchaseType", "buyerInfo.license", "buyerInfo.secLicense", "buyerInfo.firstName", "buyerInfo.name", "buyerInfo.secondaryName",
                    "buyerInfo.lastName", "buyerInfo.middleName", "buyerInfo.secFirstName", "buyerInfo.secMiddleName", "buyerInfo.secLastName", "buyerInfo.suffix", "buyerInfo.isLessor",
                    "buyerInfo.dob", "buyerInfo.secDob", "buyerInfo.email", "buyerInfo.phone", "buyerInfo.secondaryEmail", "buyerInfo.secondaryPhone", "buyerInfo.secSuffix", "buyerInfo.secondaryType", "buyerInfo.type",
                    "buyerInfo.address", "buyerInfo.secAddress", "buyerInfo.mailingAddress", "buyerInfo.secMailingAddress", "sellerInfo.dealerId",
                    "sellerInfo.salesTaxId", "sellerInfo.name", "sellerInfo.address", "sellerInfo.sellerId", "lienInfo.id", "lienInfo.firstName", "lienInfo.middleName", "lienInfo.lastName", "lienInfo.holderName",
                    "lienInfo.address", "lien.lienHolderId", "regInfo.id", "regInfo.isForHire", "regInfo.plateNumber", "regInfo.mailingAddress", "regInfo.plateTypeId", "regInfo.plateTransfer", "regInfo.costCalc",
                    "regInfo.initialTotalCost", "plate.id", "plate.categoryCode", "plate.standardFee", "plate.manufacturingFee", "plate.annualSpecialFee", "basicInfo.id",
                    "basicInfo.customerId", "customer.id", "customer.shortName", "customer.name", "customer.customerNote", "basicInfo.client", "basicInfo.unit", "tradeInInfo.tradeInAllowance",
                    "basicInfo.transactionTypeId", "basicInfo.isTitle", "transactionType.name", "insuranceInfo.id", "insuranceInfo.companyName", "tavtForm.costCalc", "tavtForm.isSales",
                    "tavtForm.taxableValue", "tavtForm.tavtPercentage", "tavtForm.titleFees", "tavtForm.titleLatePenalty", "tavtForm.salesPrice", "tavtForm.rebates", "tavtForm.discount", "tavtForm.tavtPercentage", "tavtForm.tavtDealerPenalty",
                    "tavtForm.salesTaxPercentage", "tavtForm.tavtDealerPenaltyPercentage", "tavtForm.valoremCalc", "tavtForm.salesTaxValue", "tavtForm.tavtValue", "tavtForm.titleFees", "tavtForm.titleLatePenalty", "tavtForm.agreedUponValue",
                    "billingInfo.runnerNote", "billingInfo.expressMailFees", "billingInfo.address", "billingInfo.transactionReturnType", "ticketCustomer.customerNote", "billingInfoDeposits.type", "billingInfoDeposits.amount",
                    "billingInfoDeposits.receivedDate", "billingInfoDeposits.chequeNumber"
                ])
                .where(`(ticket.id = :id AND ticket.isDeleted = false)`, { id })
                .getOne();

            if (!ticket) {
                throw new NotFoundException(error.ERR_TICKET_NOT_FOUND)
            }
            const owner = [];
            const lessees = [];
            const lessors = [];

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
            return { ...ticket, owner, lessees, lessors };
        } catch (error) {
            throwException(error);
        }
    }

    async bulkInsertSelectedForms(
        dataSource: DataSource,
        entity: any,
        formIds: number[],
        ticketId: number,
        deleteField: string = 'ticketId',
        insertFields: { formId: string, ticketId: string, isSelected?: boolean },
        isForForms: boolean = false  //flag to formIds
    ): Promise<void> {
        await dataSource.transaction(async transactionalEntityManager => {
            if (isForForms && formIds.length === 0) {
                // If formIds empty,isSelected false for ticketId
                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(entity)
                    .set({ isSelected: false })
                    .where(`${deleteField} = :ticketId`, { ticketId })
                    .execute();
            } else {
                // Delete existing records
                await transactionalEntityManager
                    .createQueryBuilder()
                    .delete()
                    .from(entity)
                    .where(`${deleteField} = :ticketId`, { ticketId })
                    .execute();

                //entities for insertion
                const entities = formIds.map(formId => ({
                    [insertFields.formId]: formId,  // map formId/stampId to field
                    [insertFields.ticketId]: ticketId,
                    ...(insertFields.isSelected !== undefined && { isSelected: insertFields.isSelected })
                }));

                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(entity)
                    .values(entities)
                    .execute();
            }
        });
    }

    async fetchTransactionForm(ticketId) {
        return Tickets.createQueryBuilder("ticket")
            .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
            .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
            .leftJoin(TransactionForms, "transactionForms", "transactionForms.transactionCode IS NULL OR transactionForms.transactionCode = transactionType.transactionCode")
            .select(["transactionForms.formShortCode"])
            .where("ticket.id = :ticketId and transactionForms.isDeleted=false", { ticketId })
            .getRawMany();
    }

    async fetchDocumentPaths(ids: number[], ticketId: number): Promise<string[]> {
        const getDocuments = await TicketDocuments.find({
            where: {
                id: In(ids),
                isDeleted: false
            },
            select: ["id", "fileName"],
        });

        if (!getDocuments || getDocuments.length !== ids.length) {
            throw new NotFoundException(error.ERR_DOCUMENT_NOT_FOUND);
        }

        const orderedDocuments = ids.map(id => {
            const doc = getDocuments.find(document => document.id === id);
            if (!doc) {
                throw new NotFoundException(error.ERR_DOCUMENT_NOT_FOUND);
            }
            return doc;
        });
        //full paths in order
        return this.getFullDocumentPaths(orderedDocuments, ticketId);
    }

    async getFullDocumentPaths(documents: any, ticketId): Promise<string[]> {
        const fileAccessPromises: string[] = [];
        for (const doc of documents) {
            const fileNames = Array.isArray(doc.fileName) ? doc.fileName : [doc.fileName];
            const folderPath = `${documentPath}/${ticketId}`;
            for (const fileName of fileNames) {
                const fullPath = path.join(process.cwd(), folderPath, fileName);
                fileAccessPromises.push(fullPath);
            }
        }
        const allFullPaths = await Promise.all(fileAccessPromises);
        return allFullPaths;

    }
    async deleteStamps(stamps, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,
                PdfStamp,
                stamps,
                userId,
                success.SUC_STAMP_DELETED,
                error.ERR_STAMP_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    async embedImage(ext: string, fileBuffer: Buffer, pdfDoc: PDFDocument) {
        const A4_PAGE_WIDTH = 595.28;
        const A4_PAGE_HEIGHT = 841.89;
        const SIDE_MARGIN = 30;
        const AVAILABLE_WIDTH = A4_PAGE_WIDTH - 2 * SIDE_MARGIN;

        try {
            // image based ext
            const image = ext === '.png'
                ? await pdfDoc.embedPng(fileBuffer)
                : await pdfDoc.embedJpg(fileBuffer);

            //image dimensions
            const { width: imgWidth, height: imgHeight } = image;
            const scaleFactor = AVAILABLE_WIDTH / imgWidth;
            const scaledWidth = imgWidth * scaleFactor;
            const scaledHeight = imgHeight * scaleFactor;

            // new page and draw the image
            pdfDoc.addPage().drawImage(image, {
                x: SIDE_MARGIN,
                y: (A4_PAGE_HEIGHT - scaledHeight) / 2, //center img
                width: scaledWidth,
                height: scaledHeight,
            });
        } catch (error) {
            throwException(error);
        }
    };
    async getMailingFeesByCountyId(countyId: number): Promise<any | null> {
        const cheatSheet = await CountyCheatSheet.findOne({
            where: { countyId, isDeleted: false },
            select: ['mailingFees'],
        });
        return cheatSheet ? formatPrice(cheatSheet.mailingFees) : null;
    }

    async processAndMergeFiles(
        pdfPaths: string[],
        allowedExtensions: string[],
        pdfDoc: PDFDocument,
        option: any
    ): Promise<void> {
        // Read file buffers in parallel
        const uploadedFileBuffers = await Promise.all(
            pdfPaths.map(async (filePath) => {
                const ext = path.extname(filePath).toLowerCase().trim();
                if (!allowedExtensions.includes(ext)) {
                    throw new Error(`ERR_INVALID_EXT: ${ext}`);
                }
                return fs.readFile(filePath);
            })
        );

        // Process uploaded files and merge them into the PDF
        for (const [index, filePath] of pdfPaths.entries()) {
            const ext = path.extname(filePath).toLowerCase().trim();
            const fileBuffer = uploadedFileBuffers[index];

            switch (ext) {
                case '.pdf': {
                    const uploadedPdf = await PDFDocument.load(fileBuffer);
                    const pages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
                    pages.forEach(page => pdfDoc.addPage(page));
                    break;
                }
                case '.png':
                case '.jpg':
                case '.jpeg': {
                    await this.embedImage(ext, fileBuffer, pdfDoc);
                    break;
                }
                case '.docx':
                case '.doc': {
                    const convertedPdfBuffer = await convert(fileBuffer, '.pdf', undefined); //DOC to PDF
                    const uploadedPdf = await PDFDocument.load(convertedPdfBuffer);
                    const pages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
                    pages.forEach(page => pdfDoc.addPage(page));
                    break;
                }
                case '.xlsx':
                case '.xls': {
                    await this.processExcel(fileBuffer, pdfDoc, option);  // append Excel content pdf
                    break;
                }
                default: {
                    throw new Error(`ERR_UNSUPPORTED_EXT: ${ext}`);
                }
            }
        }
    }

    readExcelDataInChunks(filePath: string, chunkSize: number): any {
        const workbook = xlsx.readFile(filePath, { type: 'file' });
        const results = [];

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet, { raw: true, defval: null });
            // Process data in chunks
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                results.push({ sheetName, chunk });
            }
        });

        return results;
    }
    async processExcel(fileBuffer: Buffer, pdfDoc: PDFDocument, options: any): Promise<void> {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheets = workbook.SheetNames;
        const excelPdfBuffers = await Promise.all(sheets.map(sheetName => this.processSheet(workbook, sheetName, options)));
        // Merge generated PDFs Excel to main pdf
        await this.mergePdfBuffers(excelPdfBuffers, pdfDoc);
    }

    private async processSheet(workbook: xlsx.WorkBook, sheetName: string, options: any): Promise<Buffer> {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        const htmlContent = this.generateHtmlFromSheet(jsonData, sheetName);    // Excel data HTML tables
        // Convert HTML to PDF buffer
        return this.createPdfPageFromHtml(htmlContent, options);
    }
    // Merge PDF buffers to main pdfDoc
    private async mergePdfBuffers(excelPdfBuffers: Buffer[], pdfDoc: PDFDocument): Promise<void> {
        for (const excelBuffer of excelPdfBuffers) {
            const uploadedPdf = await PDFDocument.load(excelBuffer);
            const pages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
            pages.forEach(page => pdfDoc.addPage(page));
        }
    }
    // arrange xls data in pdf table
    generateHtmlFromSheet(jsonData: any[], sheetName: string): string {
        const tableHeaders = Object.keys(jsonData[0] || {}).map(key => `<th>${key}</th>`).join('');
        const tableRows = jsonData.map(row => {
            const rowData = Object.values(row).map(value => `<td>${value}</td>`).join('');
            return `<tr>${rowData}</tr>`;
        }).join('');

        return `
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-size: 10px;
            }
            th {
                background-color: #f2f2f2;
            }
            td {
                width: 150px;
                word-wrap: break-word;
                white-space: normal;
                word-break: break-all;
            }
        </style>
        <h3>${sheetName}</h3>
        <table>
            <thead>
                <tr>${tableHeaders}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        `;
    }
    //convert HTML to a PDF page 
    async createPdfPageFromHtml(htmlContent: string, options: any): Promise<Buffer> {
        const pdfBuffer = await pdf.generatePdf({ content: htmlContent }, options);  //PDF buffer
        return pdfBuffer;
    }
}

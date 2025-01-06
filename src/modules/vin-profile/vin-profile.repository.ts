import { Injectable } from "@nestjs/common";
import { VinProfile } from "src/shared/entity/vin-profile.entity";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { throwException } from "src/shared/utility/throw-exception";
import { DataSource, Repository } from "typeorm";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { BillingProcess } from "src/shared/entity/billing-process.entity";
import moment from "moment";

@Injectable()
export class VinProfileRepository extends Repository<VinProfile> {
    constructor(
        readonly dataSource: DataSource,
        private socketGateway: SocketGateway
    ) {
        super(VinProfile, dataSource.createEntityManager());
    }

    async getVinProfile(ticketId: number): Promise<any> {
        try {
            const vinProfile = await this.manager.createQueryBuilder(BillingProcess, "billingProcess")
                .leftJoinAndSelect("billingProcess.ticket", "ticket")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", "ticketDocuments.isDeleted = false and ticketDocuments.isBillingDocDelete = false")
                .select(["billingProcess.vinModule", "billingProcess.buyerModule", "billingProcess.lienModule", "billingProcess.transactionReturnModule",
                    "billingProcess.billingModule", "ticket.id", "vinInfo.id", "vinInfo.bodyStyle", "vinInfo.productClass", "vinInfo.shippingWeight",
                    "ticketDocuments.id", "ticketDocuments.fileName", "ticketDocuments.description", "ticketDocuments.updatedAt", "ticketDocuments.createdAt", "ticketDocuments.isSigned",])
                .where(`(billingProcess.ticketId = :id)`, { id: ticketId })
                .getOne();

            const expirationDate = vinProfile?.vinModule?.expirationDate;
            const currentDate = moment().format('MM/DD/YYYY');
            const now = moment(currentDate, 'MM/DD/YYYY');
            const expiry = moment(expirationDate, 'MM/DD/YYYY');
            const daysRemaining = expiry.diff(now, 'days');
            let notification;

            if (daysRemaining <= 30 && daysRemaining > 0) {
                notification = daysRemaining;
            }

            const vehicleDetails = {
                vinNumber: vinProfile?.vinModule?.vinNumber,
                make: vinProfile?.vinModule?.make,
                model: vinProfile?.vinModule?.model,
                year: vinProfile?.vinModule?.year,
                bodyStyle: vinProfile?.ticket?.vinInfo?.bodyStyle,
                productClass: vinProfile?.ticket?.vinInfo?.productClass,
                color: vinProfile?.vinModule?.color,
                gvw: vinProfile?.vinModule?.gvw,
                vehicleUse: vinProfile?.vinModule?.vehicleUse,
                shippingWeight: vinProfile?.ticket?.vinInfo?.shippingWeight,
                odometer: null
            }
            const vehicleRegistrationDetails = {
                taxType: null,
                title: vinProfile?.vinModule?.title,
                plateCategory: vinProfile?.vinModule?.plateCategory,
                titlePrinted: null,
                expirationDate: vinProfile?.vinModule?.expirationDate
            }

            return { vehicleDetails, vehicleRegistrationDetails, ownerShip: vinProfile?.buyerModule, lienDetails: vinProfile?.lienModule, documents: vinProfile?.ticket?.ticketDocument, notification };
        } catch (err) {
            throwException(err);
        }
    }

    async setVinProfile(payload, userId) {
        try {
            let data = await VinProfile.findOne({ where: { ticketId: payload.ticketId } });
            let isUpdate: boolean;
            if (data) {
                Object.assign(data, payload);
                data.updatedBy = userId;
                data.updatedAt = new Date();
                isUpdate = true;
            } else {
                data = VinProfile.create({
                    ...payload,
                    createdBy: userId,
                    createdAt: new Date(),
                });
                isUpdate = false;
            }
            await VinProfile.save(data)

            const latestBillingProcess = await this.getVinProfileByTicket(payload.ticketId);
            this.socketGateway.formDataUpdatedEvent(data.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingProcess, DataEntryFormType.VIN_PROFILE);

            const moduleKeys = ["billingModule", "feesModule", "lienModule", "buyerModule", "vinModule"];

            let formStart;
            if (isUpdate && latestBillingProcess) {
                const changes: any[] = [];

                for (const moduleKey of moduleKeys) {
                    if (payload[moduleKey] && latestBillingProcess[moduleKey]) {
                        const moduleData = payload[moduleKey];
                        const latestModuleData = latestBillingProcess[moduleKey];
                        for (const key in moduleData) {
                            if (moduleData[key] !== latestModuleData[key]) {
                                const fieldName = `${moduleKey}.${key}`;
                                const oldValue = latestModuleData[key];
                                const newValue = moduleData[key];
                                changes.push({ fieldName, oldValue, newValue });
                            }
                        }
                    }
                }

                if (changes.length > 0) {
                    formStart = changes.map(change => ({
                        userId: userId,
                        actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                        ticketId: payload.ticketId,
                        fieldName: change.fieldName,
                        newData: change.newValue,
                        oldData: change.oldValue,
                        formType: DataEntryFormType.BILLING_PROCESS_ACTIVITY
                    }));
                }
                console.log('formStart: ', formStart);
            }
            return latestBillingProcess
        } catch (error) {
            throwException(error);
        }
    }

    async getVinProfileByTicket(ticketId) {
        try {
            const data: any = await this.manager.createQueryBuilder(VinProfile, "vinProfile")
                .select([""])
                .where(`(vinProfile.ticketId = :id)`, { id: ticketId })
                .getOne();

            return data;
        } catch (error) {
            throwException(error);
        }
    }

    async VinProfileDocsPreview(doc) {
        try {
            const data: any = await this.manager.createQueryBuilder(VinProfile, "vinProfile")

            return data;
        } catch (error) {
            throwException(error);
        }
    }
}
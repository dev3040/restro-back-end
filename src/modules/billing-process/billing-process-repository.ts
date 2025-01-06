import { Injectable, NotFoundException } from "@nestjs/common";
import { BillingInfo } from "src/shared/entity/billing-info.entity";
import { DataSource, Repository } from "typeorm";
import { throwException } from "src/shared/utility/throw-exception";
import { Tickets } from "src/shared/entity/tickets.entity";
import { BillingProcess } from "src/shared/entity/billing-process.entity";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";

@Injectable()
export class BillingProcessRepository extends Repository<BillingInfo> {
   constructor(
      readonly dataSource: DataSource,
      private readonly socketGateway: SocketGateway
   ) {
      super(BillingInfo, dataSource.createEntityManager());
   }

   async getInitialData(ticketId) {
      try {
         const ticket: any = await this.manager.createQueryBuilder(Tickets, "ticket")
            .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
            .leftJoinAndSelect("vinInfo.primaryColor", "primaryColor")
            .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
            .leftJoinAndSelect("ticket.titleInfo", "titleInfo")
            .leftJoinAndSelect("ticket.tavtForm", "tavtForm")
            .leftJoinAndSelect("ticket.billingInfoDeposits", "billingInfoDeposits")
            .leftJoinAndSelect("ticket.billingInfo", "billingInfo")
            .leftJoinAndSelect("ticket.registrationInfo", "regInfo")
            .leftJoinAndSelect("regInfo.plate", "plate")
            .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
            .leftJoinAndSelect("ticket.lienInfo", "lienInfo", "lienInfo.isDeleted = false")
            .leftJoinAndSelect("lienInfo.lien", "lien")
            .leftJoinAndSelect("buyerInfo.county", "county")
            .leftJoinAndSelect("county.countyCheatSheet", "countyCheatSheet")
            .leftJoinAndSelect("ticket.ticketDocument", "ticketDocuments", "ticketDocuments.isDeleted = false and ticketDocuments.isBillingDocDelete = false")
            .select([
               "ticket.id",
               "basicInfo.id", "basicInfo.client", "basicInfo.unit",
               "vinInfo.id", "vinInfo.vinNumber", "vinInfo.gvw",
               "vinInfo.year", "vinInfo.model", "vinInfo.make", "vinInfo.type",
               "vinInfo.primaryColorId", "primaryColor",
               "titleInfo.isNew",
               "regInfo.id", "regInfo.plateTypeId", "regInfo.expirationDate", "regInfo.plateTransfer", "regInfo.isForHire",
               "regInfo.costCalc",
               "plate.id", "plate.plateDetails", "plate.categoryCode",
               "buyerInfo.id", "buyerInfo.district", "buyerInfo.isLessee",
               "buyerInfo.name", "buyerInfo.firstName", "buyerInfo.middleName", "buyerInfo.lastName", "buyerInfo.type", "buyerInfo.address", "buyerInfo.phone",
               "buyerInfo.isOwner", "buyerInfo.isLessor",
               "county.id", "county.name", "countyCheatSheet.mailingFees",
               "lienInfo.id", "lienInfo.address", "lienInfo.holderName", "lienInfo.isElt", "lien.lienHolderId",
               "ticketDocuments.id", "ticketDocuments.fileName", "ticketDocuments.description", "ticketDocuments.isSigned",
               "tavtForm.costCalc", "tavtForm.titleFees", "tavtForm.titleLatePenalty", "tavtForm.tavtValue", "tavtForm.tavtDealerPenalty",
               "billingInfoDeposits.type", "billingInfoDeposits.chequeNumber", "billingInfoDeposits.receivedDate", "billingInfoDeposits.amount",
               "billingInfo.transactionReturnType",
               "billingInfo.expressMailFees",
               "billingInfo.address",
               "billingInfo.isDifferentAddress",
               "billingInfo.trackingLabel",

            ])
            .where(`(ticket.id = :id AND ticket.isDeleted = false)`, { id: ticketId })
            .addOrderBy("billingInfoDeposits.id")
            .getOne();

         if (!ticket) {
            throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&id`)
         }

         return ticket;
      } catch (error) {
         throwException(error);
      }
   }

   async setBillingProcess(payload, userId) {
      try {
         let data = await BillingProcess.findOne({ where: { ticketId: payload.ticketId } });
         let isUpdate: boolean;
         if (data) {
            Object.assign(data, payload);
            data.updatedBy = userId;
            data.updatedAt = new Date();
            isUpdate = true;
         } else {
            data = BillingProcess.create({
               ...payload,
               createdBy: userId,
               createdAt: new Date(),
            });
            isUpdate = false;
         }
         await BillingProcess.save(data)

         const latestBillingProcess = await this.getBillingProcessing(payload.ticketId);
         this.socketGateway.formDataUpdatedEvent(
            data.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingProcess, DataEntryFormType.BILLING_PROCESS);

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
               console.log("formStart", formStart);
            }

            // if (formStart !== undefined) {
            //    this.activityLogService.addActivityLog(formStart, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
            // }
         }
         return latestBillingProcess
      } catch (error) {
         throwException(error);
      }
   }

   async getBillingProcessing(ticketId) {
      try {
         const data: any = await this.manager.createQueryBuilder(BillingProcess, "billingProcess")
            .select(["billingProcess.vinModule",
               "billingProcess.buyerModule",
               "billingProcess.lienModule",
               "billingProcess.feesModule",
               "billingProcess.serviceFeesModule",
               "billingProcess.transactionReturnModule",
               "billingProcess.billingModule"])
            .where(`(billingProcess.ticketId = :id)`, { id: ticketId })
            .getOne();

         return data;
      } catch (error) {
         throwException(error);
      }
   }
}
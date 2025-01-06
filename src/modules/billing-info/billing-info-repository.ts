import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { join } from "path";
import * as fs from 'fs';
import * as htmlToPdf from 'html-pdf-node';
import { BillingInfo } from "src/shared/entity/billing-info.entity";
import { DataSource, Repository } from "typeorm";
import { SetBillingInfoDto } from "./dto/set-billing-details.dto";
import { throwException } from "src/shared/utility/throw-exception";
import { Tickets } from "src/shared/entity/tickets.entity";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { BillingInfoDeposits } from "src/shared/entity/billing-info-deposits.entity";
import { findBillingInfoStartedLog, findTicket, getBillingDepositType, getCustomerAddress, getExpressMailFees, getTransactionReturnType } from "src/shared/utility/common-function.methods";
import { TransactionReturnTypeEnum } from "src/shared/enums/transaction-return-type.enum";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ActivityLogPayload } from "../activity-logs/activity-log.interface";
import { ActivityLogs } from "src/shared/entity/activity-logs.entity";
import { BillingDepositTypesEnum } from "src/shared/enums/billing-deposit-type.enum";

@Injectable()
export class BillingInfoRepository extends Repository<BillingInfo> {
   constructor(
      readonly dataSource: DataSource,
      private activityLogService: ActivityLogsService,
      private socketGateway: SocketGateway
   ) {
      super(BillingInfo, dataSource.createEntityManager());
   }

   async setDepositInfo(setBillingInfo: SetBillingInfoDto, userId: number, isSummary: boolean) {
      try {
         const { ticketId } = setBillingInfo;

         let isUpdate: boolean;
         let isNewRecord: boolean;
         let depositData: any;
         const depositType = setBillingInfo?.depositsData?.type;
         if (depositType && ![BillingDepositTypesEnum.US, BillingDepositTypesEnum.COUNTY].includes(depositType)) {
            throw new BadRequestException(`INVALID_DEPOSIT_TYPE&&&type&&&ERROR_MESSAGE`)
         }
         if (setBillingInfo?.depositsData?.receivedDate && new Date(setBillingInfo.depositsData.receivedDate) > new Date()) {
            throw new BadGatewayException(`ERR_DATE_RECEIVED&&&receivedDate`);
         }
         if (setBillingInfo?.depositsData?.amount && isNaN(Number(setBillingInfo?.depositsData?.amount))) {
            throw new BadGatewayException(`INVALID_AMOUNT&&&amount`);
         }
         const logExists = await findBillingInfoStartedLog(ticketId);

         if (setBillingInfo?.depositsData?.id) {
            //find existing data
            depositData = await BillingInfoDeposits.findOne({
               select: ['id', 'amount', 'ticketId', 'chequeNumber', 'receivedDate', 'type'],
               where: {
                  id: setBillingInfo?.depositsData?.id,
                  type: setBillingInfo?.depositsData?.type,
                  ticketId: ticketId
               }
            });
            if (!depositData) {
               throw new NotFoundException('ERR_DEPOSIT_DATA_NOT_FOUND&&&depositData&&&ERROR_MESSAGE')
            }
            delete setBillingInfo?.depositsData?.id;

            // Update the existing record 
            try {
               await BillingInfoDeposits.update(depositData.id,
                  { ...setBillingInfo.depositsData, updatedBy: userId });
            } catch (err) {
               throw new BadRequestException(`${err}&&&&&&ERROR_MESSAGE`)
            }
            isUpdate = true;
            isNewRecord = false;
         } else {
            // Check if reached maximum limit of type
            const maxLimit = depositType == BillingDepositTypesEnum.US ? 6 : 2;
            const specificTypeCount = await BillingInfoDeposits.count({
               where: {
                  type: depositType,
                  ticketId: ticketId
               }
            });
            if (specificTypeCount >= maxLimit) {
               const errorMessage = depositType == BillingDepositTypesEnum.US
                  ? 'ERR_DEPOSIT_US_LIMIT&&&type' : 'ERR_DEPOSIT_COUNTY_LIMIT&&&type';
               throw new BadGatewayException(errorMessage);
            }

            // Create a new record
            try {
               depositData = BillingInfoDeposits.create({
                  ...setBillingInfo.depositsData, ticketId, createdBy: userId
               });
               await BillingInfoDeposits.save(depositData);
            } catch (err) {
               throw new BadRequestException(`${err}&&&&&&ERROR_MESSAGE`)
            }
            isNewRecord = true;
            isUpdate = logExists ? true : false;
         }
         const latestBillingInfo = await this.getBillingInfo(ticketId);

         // Emit data ===> Billing info 
         this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingInfo, DataEntryFormType.BILLING_INFO);

         let data;
         const formType = !isSummary ? DataEntryFormType.BILLING_INFO_ACTIVITY : DataEntryFormType.SUMMARY_BILLING_INFO_ACTIVITY
         if (isUpdate) {
            //Update form flow
            if (isNewRecord) {
               //new record
               data = {
                  userId,
                  actionType: ActivityLogActionType.FORM_NEW_RECORD,
                  ticketId,
                  fieldName: null,
                  newData: await getBillingDepositType(depositData.type),
                  oldData: null,
                  formType
               }
               this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);
            }
         } else {
            //Form start log
            data = {
               userId,
               actionType: ActivityLogActionType.FORM_START,
               ticketId,
               fieldName: null,
               newData: null,
               oldData: null,
               formType
            }
            this.activityLogService.addActivityLog(
               data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
         }
         return { latestBillingInfo };
      } catch (error) {
         throwException(error);
      }
   }

   async setTransactionReturnInfo(setBillingInfo: SetBillingInfoDto, userId: number, isSummary: boolean) {
      try {
         const { ticketId, transactionReturnData } = setBillingInfo;
         const unwantedKeys = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'ticketId', 'billingNote', 'runnerNote'];
         let isUpdate: boolean;

         //find existing data
         let billingData: any = await this.findOne({
            select: ['id', 'address', 'expressMailFees', 'isDifferentAddress', 'ticketId', 'trackingLabel', 'transactionReturnType'],
            where: { ticketId }
         });
         const oldBillingData: any = billingData ? { ...billingData } : null;
         const logExists = await findBillingInfoStartedLog(ticketId);

         //set data as per different address 
         if (transactionReturnData?.isDifferentAddress !== undefined) {
            //don't generate log
            unwantedKeys.push('address');
            if (transactionReturnData?.isDifferentAddress) {
               //remove address 
               transactionReturnData.address = null;
            } else {
               //get customer address
               transactionReturnData.address = await getCustomerAddress(ticketId);
               unwantedKeys.push('expressMailFees');
            }
         }

         //set data as per transaction type data
         if (!billingData ||
            billingData.transactionReturnType !== transactionReturnData?.transactionReturnType) {

            if (transactionReturnData?.transactionReturnType) {
               unwantedKeys.push(...['address', 'expressMailFees', 'isDifferentAddress', 'trackingLabel']);
               transactionReturnData.trackingLabel = null;
               transactionReturnData.address = null;
               transactionReturnData.expressMailFees = null;

               if (transactionReturnData?.transactionReturnType == TransactionReturnTypeEnum.SHIP_BACK_TO_CUS_AND_CHARGE_FEE) {
                  transactionReturnData.isDifferentAddress = false;
                  //get customer's address
                  transactionReturnData.address = await getCustomerAddress(ticketId);
                  //get express mail fees
                  transactionReturnData.expressMailFees = await getExpressMailFees();
               } else if (
                  transactionReturnData?.transactionReturnType == TransactionReturnTypeEnum.SHIP_TO_CLIENT_OR_ENTER_ADDRESS_AND_CHARGE_FEE) {
                  //reset address & get exp mail fees
                  transactionReturnData.expressMailFees = await getExpressMailFees();
                  transactionReturnData.isDifferentAddress = true;
               } else if (
                  transactionReturnData?.transactionReturnType !== TransactionReturnTypeEnum.CUS_PROVIDED_LABEL_BACK_TO_THEM) {
                  //reset tracking label data
                  transactionReturnData.isDifferentAddress = false;
               } else {
                  //reset address & exp mail fees
                  transactionReturnData.isDifferentAddress = false;
               }
            }
         }
         if (billingData) {
            // Update the existing record 
            await this.update(billingData.id, { ...transactionReturnData, updatedBy: userId });
            isUpdate = logExists ? true : false;
         } else {
            // Create a new record
            billingData = this.create({ ...transactionReturnData, ticketId, createdBy: userId });
            await this.save(billingData);
            isUpdate = logExists ? true : false;
         }
         const latestBillingInfo: any = await this.getBillingInfo(ticketId);

         // Emit data ===> Billing info 
         this.socketGateway.formDataUpdatedEvent(ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingInfo, DataEntryFormType.BILLING_INFO);

         let data;
         const formType = !isSummary ? DataEntryFormType.BILLING_INFO_ACTIVITY : DataEntryFormType.SUMMARY_BILLING_INFO_ACTIVITY;

         if (isUpdate) {
            const bInfo = { ...latestBillingInfo.billingInfo };
            const changes: any[] = [];
            unwantedKeys.forEach(key => delete bInfo[key]);

            const processChange = async (key: string, oldValue: any, newValue: any) => {
               let change: any = {
                  fieldName: key,
                  oldValue: oldValue,
                  newValue: newValue
               };

               switch (key) {
                  case "transactionReturnType":
                     change.fieldName = "Transaction return type";
                     change.oldValue = oldValue ? await getTransactionReturnType(oldValue) : null;
                     change.newValue = newValue ? await getTransactionReturnType(newValue) : null;
                     break;
                  case "expressMailFees":
                     change.fieldName = "Express mail fees";
                     break;
                  case "isDifferentAddress":
                     change.fieldName = "Different address";
                     break;
                  case "trackingLabel":
                     change.fieldName = "Tracking label";
                     break;
                  case "address":
                     change.fieldName = "Address";
                     break;
                  default:
                     return key;
               }
               return change;
            };

            if (oldBillingData) {
               for (let key in bInfo) {
                  if (oldBillingData[key] !== bInfo[key]) {
                     let change = await processChange(key, oldBillingData[key], bInfo[key]);
                     if (change) { changes.push(change) };
                  }
               }
            } else {
               for (let key in bInfo) {
                  if (bInfo[key] !== null) {
                     let change = await processChange(key, null, bInfo[key]);
                     if (change) { changes.push(change) };
                  }
               }
            }

            if (changes.length > 0) {
               data = changes.map(change => ({
                  userId: userId,
                  actionType: ActivityLogActionType.FORM_DATA_UPDATE,
                  ticketId: ticketId,
                  fieldName: change.fieldName,
                  newData: change.newValue,
                  oldData: change.oldValue,
                  formType
               }));
            }
         } else {
            // For start log
            data = {
               userId,
               actionType: ActivityLogActionType.FORM_START,
               ticketId,
               fieldName: null,
               newData: null,
               oldData: null,
               formType
            };
         }
         if (data !== undefined) {
            this.activityLogService.addActivityLog(
               data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
         }
         return { latestBillingInfo };

      } catch (error) {
         throwException(error);
      }
   }

   async setBillingNote(setBillingNote, userId: number, isSummary: boolean) {
      try {
         const { ticketId } = setBillingNote;
         let getBillingData: any;

         await findTicket(ticketId);

         let isUpdate: boolean;
         let isUpdateMainNoteLog: boolean = false;
         let newNote = null;
         const isBillingNote = setBillingNote?.billingNote !== undefined;
         const field = isBillingNote ? 'Billing note' : 'Runner note';

         getBillingData = await this.findOne({
            select: ['id', 'billingNote', 'runnerNote', 'ticketId'],
            where: { ticketId }
         })
         //get previously generated log of note
         const updateExistingLog = await this.manager.createQueryBuilder(ActivityLogs, 'activityLog')
            .select(["activityLog.id", "activityLog.ticketId", "activityLog.formType", "activityLog.fieldName", "activityLog.actionType", "activityLog.newData"])
            .where(`activityLog.ticketId = ${ticketId} AND activityLog.actionType = '${ActivityLogActionType.FORM_DATA_ADD}' AND activityLog.formType IN (:...formTypes) AND activityLog.fieldName = '${field}'`, { formTypes: [`${DataEntryFormType.BILLING_INFO_ACTIVITY}`, `${DataEntryFormType.SUMMARY_BILLING_INFO_ACTIVITY}`] })
            .getOne();

         const logExists = await findBillingInfoStartedLog(ticketId);

         if (getBillingData) {
            if (isBillingNote) {
               newNote = setBillingNote?.billingNote;
               //Billing note
               if (getBillingData?.billingNote == null) {
                  //no data exists + new note 
                  isUpdateMainNoteLog = updateExistingLog ? true : false;
               } else {
                  //remove flow || update flow
                  isUpdateMainNoteLog = true;
               }
            } else {
               //Runner note
               newNote = setBillingNote?.runnerNote;
               if (getBillingData?.runnerNote == null) {
                  //no data exists + new note 
                  isUpdateMainNoteLog = updateExistingLog ? true : false;
               } else {
                  //remove flow || update flow
                  isUpdateMainNoteLog = true;
               }
            }
            // Update the existing billing info record 
            await this.update(getBillingData.id, { ...setBillingNote, updatedBy: userId });
            isUpdate = true;
         } else {
            // Create new billing info record
            getBillingData = this.create({ ...setBillingNote, createdBy: userId });
            await this.save(getBillingData);
            newNote = isBillingNote ? setBillingNote?.billingNote : setBillingNote?.runnerNote;
            isUpdate = logExists ? true : false;
         }

         const latestBillingInfo = await this.getBillingInfo(ticketId);

         // Emit data ===> Billing info 
         this.socketGateway.formDataUpdatedEvent(
            ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingInfo, DataEntryFormType.BILLING_INFO);

         let data: ActivityLogPayload[] = [];
         const formType = !isSummary ? DataEntryFormType.BILLING_INFO_ACTIVITY : DataEntryFormType.SUMMARY_BILLING_INFO_ACTIVITY
         let logCommonData = {
            userId: userId, ticketId: ticketId, formType, oldData: null
         }
         let actionType: ActivityLogActionType;

         if (isUpdate) {
            if (isUpdateMainNoteLog) {
               //update log
               actionType = (newNote == null) ? ActivityLogActionType.FORM_DATA_REMOVE : ActivityLogActionType.FORM_DATA_UPDATE;
            } else {
               //data_add log || data_remove log
               actionType = ActivityLogActionType.FORM_DATA_ADD
            }
            //Changed note log
            data.push({
               ...logCommonData,
               newData: newNote, fieldName: field, actionType: actionType
            });
         } else {
            //Form start log
            data.push({
               ...logCommonData,
               newData: null,
               actionType: ActivityLogActionType.FORM_START,
               fieldName: null,
            })
            //Added note log
            data.push({
               ...logCommonData,
               newData: newNote,
               fieldName: field,
               actionType: ActivityLogActionType.FORM_DATA_ADD,
            })
         }
         if (data.length) {
            this.activityLogService.addActivityLog(
               data, [], (isUpdate ? SocketEventEnum.FORM_DATA_UPDATE : SocketEventEnum.FORM_START));
         }
         if (isUpdateMainNoteLog && updateExistingLog) {
            //update new note in existing note activity log
            updateExistingLog.newData = newNote
            await updateExistingLog.save();

            this.socketGateway.formDataUpdatedEvent(
               ticketId, SocketEventEnum.ACTIVITY_LOG_UPDATE, updateExistingLog, DataEntryFormType.BILLING_INFO);
         }
         return { latestBillingInfo };
      } catch (error) {
         throwException(error);
      }
   }

   async getBillingInfo(ticketId: number) {
      try {
         const data = await this.manager.createQueryBuilder(Tickets, "ticket")
            .leftJoinAndSelect("ticket.billingInfo", "billingInfo")
            .leftJoinAndSelect("ticket.billingInfoDeposits", "billingInfoDeposits")
            .select([
               "ticket.id",
               "billingInfo.id", "billingInfo.ticketId", "billingInfo.expressMailFees", "billingInfo.address", "billingInfo.isDifferentAddress", "billingInfo.transactionReturnType", "billingInfo.trackingLabel", "billingInfo.billingNote", "billingInfo.runnerNote",
               "billingInfoDeposits.id", "billingInfoDeposits.ticketId", "billingInfoDeposits.chequeNumber", "billingInfoDeposits.amount", "billingInfoDeposits.type", "billingInfoDeposits.receivedDate"
            ])
            .where(`(ticket.id = :ticketId)`, { ticketId })
            .orderBy('billingInfoDeposits.id', 'ASC')
            .getOne();
         if (!data) {
            throw new NotFoundException(`ERR_BILLING_DATA_NOT_FOUND`)
         }
         return data;
      } catch (error) {
         throwException(error);
      }
   }

   async deleteDeposit(id: number, userId: number) {
      try {
         const deposit = await BillingInfoDeposits.findOne({
            select: ['id', 'ticketId', 'type'],
            where: { id: id }
         });
         if (!deposit) {
            throw new NotFoundException(`ERR_DEPOSIT_DATA_NOT_FOUND&&&id&&&ERROR_MESSAGE`);
         }
         await this.manager
            .createQueryBuilder(BillingInfoDeposits, 'deposit')
            .delete()
            .where("id = :id", { id })
            .execute();

         // Emit data ===> Billing info 
         const latestBillingInfo: any = await this.getBillingInfo(deposit.ticketId);

         this.socketGateway.formDataUpdatedEvent(deposit.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestBillingInfo, DataEntryFormType.BILLING_INFO);

         //activity log for deleted deposit
         const data: ActivityLogPayload = {
            userId,
            actionType: ActivityLogActionType.FORM_DATA_REMOVE,
            ticketId: deposit.ticketId,
            fieldName: await getBillingDepositType(deposit.type),
            newData: null,
            oldData: null,
            formType: DataEntryFormType.BILLING_INFO_ACTIVITY,
         };
         this.activityLogService.addActivityLog(data, [], SocketEventEnum.FORM_DATA_UPDATE);

         return deposit.ticketId;
      } catch (error) {
         throwException(error);
      }
   }

   async generateCountyReport(ticketId): Promise<Buffer | null> {
      try {

          const cssPath = join(process.cwd(), 'src/pdf-html/styles.css');
          const cssContent = await fs.promises.readFile(cssPath, { encoding: 'utf8' });
          const filePath = join(process.cwd(), 'src/pdf-html/billing-info/invoice.html');
          let content = await fs.promises.readFile(filePath, 'utf8');

          // const reportData = await this.fetchInvoiceDataByTicket(ticketId);
          const mappings: Record<string, string> = {
              // '{{}}': generateColumn(reportData),
          };

          const replacePlaceholders = (content: string, mappings: Record<string, string>): string => {
              return content.replace(/{{\w+}}/g, (match) => mappings[match] || '');
          };
          content = replacePlaceholders(content, mappings);
          const bodyContent = `<div class="form-content">${content}</div>`;

          const htmlContent = `
              <!DOCTYPE html>
              <html lang="en">
                  <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Tags & Titles PDF</title>
                      <style>${cssContent}</style>
                  </head>
                  <body>
                      ${bodyContent}
                  </body>
              </html>
          `;

          const file = { content: htmlContent };
          const pdfBuffer = htmlToPdf.generatePdf(file, { format: 'A4', printBackground: true });

          return pdfBuffer;
      } catch (error) {
          throwException(error);
      }
  }


}
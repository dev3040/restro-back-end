import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BillingInfoRepository } from "./billing-info-repository";
import { SetBillingInfoDto } from "./dto/set-billing-details.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { SetBillingNotesDto } from "./dto/set-notes.dto";
import { findTicket } from "src/shared/utility/common-function.methods";
import { TicketsRepository } from "../ticket-management/ticket-management.repository";

@Injectable()
export class BillingInfoService {
   constructor(
      @InjectRepository(BillingInfoRepository)
      private readonly billingInfoRepository: BillingInfoRepository,
      private readonly ticketsRepository: TicketsRepository,
   ) { }

   async setBillingInfo(setBillingInfo: SetBillingInfoDto, userId: number, isSummary: boolean): Promise<AppResponse> {
      try {
         await findTicket(setBillingInfo.ticketId);
         let res;
         if (setBillingInfo?.depositsData !== undefined) {
            res = await this.billingInfoRepository.setDepositInfo(setBillingInfo, userId, isSummary);
         }
         if (setBillingInfo.transactionReturnData !== undefined) {
            res = await this.billingInfoRepository.setTransactionReturnInfo(setBillingInfo, userId, isSummary);
         }
         //assign ticket to logged in user is not a assignee
         await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(setBillingInfo.ticketId, userId);

         return {
            message: "SUC_BILLING_INFO_SAVED",
            data: res.data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async setBillingNote(setBillingNotes: SetBillingNotesDto, userId: number, isSummary: boolean): Promise<AppResponse> {
      try {
         const data = await this.billingInfoRepository.setBillingNote(setBillingNotes, userId, isSummary);

         //assign ticket to logged in user is not a assignee
         await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(setBillingNotes.ticketId, userId);
         return {
            message: "SUC_BILLING_INFO_SAVED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async deleteDeposit(id: number, userId: number): Promise<AppResponse> {
      try {
         const ticketId = await this.billingInfoRepository.deleteDeposit(id, userId)

         //assign ticket to logged in user is not a assignee
         await this.ticketsRepository.addAssigneeIfNotAlreadyAdded(ticketId, userId);

         return {
            message: "SUC_BILLING_DEPOSIT_DELETED",
            data: {}
         };
      } catch (error) {
         throwException(error);
      }
   }

   async invoicePdf(ticketId,  res: any): Promise<any> {
      try {
          const buffer = await this.billingInfoRepository.generateCountyReport(ticketId);
          res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=invoice.pdf`,
              'Content-Length': buffer.length,
          });

          res.end(buffer);
      } catch (error) {
          throwException(error)
      }
  }

}
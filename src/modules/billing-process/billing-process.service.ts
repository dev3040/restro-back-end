import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BillingProcessRepository } from "./billing-process-repository";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { SetBillingProcessDto } from "./dto/set-billing-process.dto";
import { findTicket } from "src/shared/utility/common-function.methods";
@Injectable()
export class BillingProcessService {
   constructor(
      @InjectRepository(BillingProcessRepository)
      private readonly billingProcessRepository: BillingProcessRepository,
   ) { }

   async setBillingProcess(payload: SetBillingProcessDto, userId: number): Promise<AppResponse> {
      try {
         await findTicket(payload.ticketId);
         const data = await this.billingProcessRepository.setBillingProcess(payload, userId)

         return {
            message: "SUC_BILLING_INFO_SAVED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }


   async getInitialData(ticketId): Promise<AppResponse> {
      try {
         const data = await this.billingProcessRepository.getInitialData(ticketId);
         return {
            message: "SUC_BILLING_PROCESS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async getBillingProcess(ticketId) {
      try {
         await findTicket(ticketId);
         const data = await this.billingProcessRepository.getBillingProcessing(ticketId)

         return {
            message: "SUC_BILLING_PROCESS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

}
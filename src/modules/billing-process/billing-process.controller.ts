import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingProcessService } from "./billing-process.service";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { SetBillingProcessDto } from "./dto/set-billing-process.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";


@ApiTags("Billing Process")
@Controller("/billing-process")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class BillingProcessController {
   constructor(private readonly billingProcessService: BillingProcessService) { }

   @Put()
   @ApiOperation({ summary: "Save Billing Process" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
   async addBillingProcess(
      @Body() payload: SetBillingProcessDto,
      @GetUser() user: User
   ): Promise<AppResponse> {
      return this.billingProcessService.setBillingProcess(payload, user.id);
   }

   @Get('initial/:ticketId')
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   async getInitialData(@Param("ticketId") ticketId: string) {
      return this.billingProcessService.getInitialData(ticketId);
   }

   @Get('/:ticketId')
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   async generateCsv(@Param("ticketId") ticketId: string) {
      return this.billingProcessService.getBillingProcess(ticketId);
   }

}
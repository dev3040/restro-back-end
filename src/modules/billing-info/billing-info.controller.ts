import { Body, Controller, Delete, Get, Param, Put, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingInfoService } from "./billing-info.service";
import { SetBillingInfoDto } from "./dto/set-billing-details.dto";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { SetBillingNotesDto } from "./dto/set-notes.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";


@ApiTags("Billing Info")
@Controller("data-entry/billing-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class BillingInfoController {
   constructor(private readonly billingInfoService: BillingInfoService) { }

   @Put()
   @ApiOperation({ summary: "Save Billing Info" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
   async addBillingInfo(
      @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
      @Body() addBillingInfoDto: SetBillingInfoDto,
      @GetUser() user: User
   ): Promise<AppResponse> {
      return this.billingInfoService.setBillingInfo(addBillingInfoDto, user.id, isSummary);
   }

   @Put("/notes")
   @ApiOperation({ summary: "Save Billing Note" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
   async setBillingNote(
      @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
      @Body() addBillingInfoDto: SetBillingNotesDto,
      @GetUser() user: User
   ): Promise<AppResponse> {
      return this.billingInfoService.setBillingNote(addBillingInfoDto, user.id, isSummary);
   }

   @Delete("deposit/:id")
   @ApiOperation({ summary: "Delete A Particular Deposit Data" })
   @ApiResponse({ status: 200, description: "Api success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   deleteDeposit(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
      return this.billingInfoService.deleteDeposit(+id, user.id);
   }

   @Get(":ticketId/invoice")
   @ApiOperation({ summary: "Generate invoice PDF" })
   @ApiResponse({ status: 200, description: "API success" })
   @ApiResponse({ status: 422, description: "Bad Request or API error message" })
   @ApiResponse({ status: 404, description: "Not found!" })
   @ApiResponse({ status: 500, description: "Internal server error!" })
   generateInvoicePdf(@Param('ticketId') ticketId: number, @Res() res: Response): Promise<void> {
      return this.billingInfoService.invoicePdf(ticketId, res);
   }


}
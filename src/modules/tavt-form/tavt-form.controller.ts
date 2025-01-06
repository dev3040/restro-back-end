import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { TavtFormService } from "./tavt-form.service";
import { User } from "src/shared/entity/user.entity";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { TavtFormDto } from "./dto/save-tavt-form.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";
import { SalesTaxMasterDto } from "./dto/update-sales-tax.dto";
import { ListSalesTaxDto } from "src/shared/dtos/list-data.dto";


@ApiTags("TAVT Form")
@Controller('data-entry/tavt-form')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class TavtFormController {
    constructor(private readonly tavtFormService: TavtFormService) { }

    @Put("/")
    @ApiOperation({ summary: "Save tavt form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Title info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    saveTavtForm(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Body(ValidationPipe) regInfo: TavtFormDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.tavtFormService.saveTavtForm(regInfo, user.id, isSummary)
    }

    @Get("/sales-tax")
    @SkipThrottle()
    @ApiOperation({ summary: "Get sales tax list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTaxAbleMasterList(@Query() query: ListSalesTaxDto): Promise<AppResponse> {
        return this.tavtFormService.getSalesTaxList(query);
    }

    @Get("/sales-tax/:countyId")
    @SkipThrottle()
    @ApiOperation({ summary: "Get sales tax list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'query', required: false, type: Number, description: 'Optional city ID' })
    getSalesTaxById(@Param("countyId") countyId: number, @Query() query): Promise<AppResponse> {
        return this.tavtFormService.getSalesTaxById(countyId, query);
    }

    @Put("/sales-tax/:id")
    editFmvPdfData(
        @Param("id") id: number,
        @Body(ValidationPipe) updateSalesTax: SalesTaxMasterDto,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.tavtFormService.editSalesTax(updateSalesTax, id, user)
    }

    @Get("/:ticketId")
    @ApiOperation({ summary: "Get tavt form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTavtForm(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.tavtFormService.getTavtForm(ticketId);
    }

    @Get("calc-info/:ticketId")
    @ApiOperation({ summary: "Get registration info form" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCalcInfo(@Param("ticketId") ticketId: string): Promise<AppResponse> {
        return this.tavtFormService.getCalcInfo(ticketId);
    }

    @Delete("/delete-other-fees/:id")
    @ApiOperation({ summary: "Delete other fees" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDocument(@Param("id") id: string, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtFormService.deleteOtherFees(id, user);
    }
}
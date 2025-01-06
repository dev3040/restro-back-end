import { Body, Controller, Delete, Get, Optional, Param, Patch, Put, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { TavtTaxExemptionMasterService } from "./tax-exemption.service";
import { DeleteExemptionDto, SaveTaxExemptionMasterDto } from "./dto/add-tax-exemption.dto";
import { ListTaxExemptionsDto } from "src/shared/dtos/list-data.dto";

@ApiTags("TAVT Tax Exemption Master")
@Controller('tavt-exemption-master')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class TavtTaxExemptionMasterController {
    constructor(private readonly tavtTaxExemptionMasterService: TavtTaxExemptionMasterService) { }

    @Put("/:id?")
    @ApiOperation({ summary: "Save tavt tax exemption master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiParam({ name: 'id', required: false, description: 'Optional ID' })
    saveTaxExemptionMaster(@Param("id") @Optional() id: number, @Body(ValidationPipe) taxExemptionMaster: SaveTaxExemptionMasterDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxExemptionMasterService.saveTaxExemptionMaster(taxExemptionMaster, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/Inactive tavt tax exemption master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveTaxExemptionMaster(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxExemptionMasterService.activeInactiveTaxExemptionMaster(id, user);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get tavt tax exemption master by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTaxExemptionMaster(@Param("id") id: string): Promise<AppResponse> {
        return this.tavtTaxExemptionMasterService.getTaxExemptionMaster(id);
    }

    @Get()
    @SkipThrottle()
    @ApiOperation({ summary: "Get tavt tax exemption master list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTaxExemptionMasterList(@Query() query: ListTaxExemptionsDto): Promise<AppResponse> {
        return this.tavtTaxExemptionMasterService.getTaxExemptionMasterList(query);
    }

    @Delete('/')
    @ApiOperation({ summary: "Delete tavt tax exemptions" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTaxExemptions(@Body() exemption: DeleteExemptionDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxExemptionMasterService.deleteTaxExemptions(exemption, user.id);
    }

}
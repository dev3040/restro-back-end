import { Body, Controller, Delete, Get, Optional, Param, Patch, Put, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { TavtTaxAbleMasterService } from "./tavt-taxable-master.service";
import { User } from "src/shared/entity/user.entity";
import { DeleteTaxAbleDto, SaveTaxAbleMasterDto } from "src/modules/tavt-taxable-master/dto/add-taxable-master.dto"
import { ListTaxableItemsDto } from "src/shared/dtos/list-data.dto";

@ApiTags("TAVT Taxable Master")
@Controller('tavt-taxable-master')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class TavtTaxAbleMasterController {
    constructor(private readonly tavtTaxAbleMasterService: TavtTaxAbleMasterService) { }

    @Put("/:id?")
    @ApiOperation({ summary: "Save Tavt Taxable Master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiParam({ name: 'id', required: false, description: 'Optional ID' })
    saveTaxAbleMaster(@Param("id") @Optional() id: number, @Body(ValidationPipe) taxAbleMaster: SaveTaxAbleMasterDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxAbleMasterService.saveTaxAbleMaster(taxAbleMaster, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/Inactive Tavt Taxable Master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveTaxAbleMaster(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxAbleMasterService.activeInactiveTaxAbleMaster(id, user);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get tavt taxable master by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTaxAbleMaster(@Param("id") id: string): Promise<AppResponse> {
        return this.tavtTaxAbleMasterService.getTaxAbleMaster(id);
    }

    @Get()
    @SkipThrottle()
    @ApiOperation({ summary: "Get tavt taxable master list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTaxAbleMasterList(@Query() query: ListTaxableItemsDto): Promise<AppResponse> {
        return this.tavtTaxAbleMasterService.getTaxAbleMasterList(query);
    }

    @Delete('/')
    @ApiOperation({ summary: "Delete tavt taxable masters" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTaxAbleMasters(@Body() taxAble: DeleteTaxAbleDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tavtTaxAbleMasterService.deleteTaxAbleMasters(taxAble, user.id);
    }

}
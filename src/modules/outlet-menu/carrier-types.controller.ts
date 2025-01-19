import { Body, Controller, Post, ValidationPipe, Put, Param, Get, Query, UseGuards, Delete } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { CarrierTypesService } from "./carrier-types.service";
import { AddCarrierTypeDto, DeleteCarrierTypesDto, UpdateCarrierTypeDto } from "./dto/add-carrier-type.dto";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListCarrierTypesDto } from "src/shared/dtos/list-data.dto";


@ApiTags("Outlet Menu")
@Controller("outlet-menu")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class CarrierTypesController {
    constructor(private readonly carrierTypeService: CarrierTypesService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create Carrier Type" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addCarrierType(
        @Body() createCarrierType: AddCarrierTypeDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.carrierTypeService.addCarrierType(createCarrierType, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get carrier type list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCarrierTypeList(
        @Query() query: ListCarrierTypesDto,
    ): Promise<AppResponse> {
        return this.carrierTypeService.getCarrierTypeList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get carrier type details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCarrierType(
        @Param("id") id: number
    ): Promise<AppResponse> {
        return this.carrierTypeService.getCarrierType(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit carrier type details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "CarrierType Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editCarrierType(
        @Param("id") id: number,
        @Body(ValidationPipe) updateCarrierType: UpdateCarrierTypeDto,
    ): Promise<AppResponse> {
        return this.carrierTypeService.editCarrierType(updateCarrierType, id);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete carrier types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteCarrierTypes(@Body() deleteCarrier: DeleteCarrierTypesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.carrierTypeService.deleteCarrierTypes(deleteCarrier, user.id);
    }


}

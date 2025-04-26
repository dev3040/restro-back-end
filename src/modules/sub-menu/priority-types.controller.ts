import { Body, Controller, Post, ValidationPipe, Put, Param, UseGuards, Get, Query, Delete } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { PriorityTypesService } from "./priority-types.service";
import { AddPriorityTypesDto, DeletePriorityDto, UpdatePriorityTypesDto } from "./dto/add-priority-types.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListPrioritiesDto } from "../../shared/dtos/list-data.dto";

@ApiTags("Sub Menu")
@Controller("sub-menu")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class PriorityTypesController {
    constructor(private readonly priorityTypesService: PriorityTypesService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create Priority Types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addPriorityTypes(@Body() createPriorityTypes: AddPriorityTypesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.priorityTypesService.addPriorityTypes(createPriorityTypes, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get priority types list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getPriorityTypesList(@Query() query: ListPrioritiesDto): Promise<AppResponse> {
        return this.priorityTypesService.getPriorityTypesList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get priority types details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getPriorityTypes(@Param("id") id: string): Promise<AppResponse> {
        return this.priorityTypesService.getPriorityTypes(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit priority types details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "SubItems Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editPriorityTypes(@Param("id") id: string, @Body(ValidationPipe) updatePriorityTypes: UpdatePriorityTypesDto): Promise<AppResponse> {
        return this.priorityTypesService.editPriorityTypes(updatePriorityTypes, id);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete priority types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deletePriorityTypes(@Body() deletePriority: DeletePriorityDto, @GetUser() user: User): Promise<AppResponse> {
        return this.priorityTypesService.deletePriorityTypes(deletePriority, user.id);
    }

    @Get("/category/:categoryId")
    @ApiOperation({ summary: "Get items by category ID" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getItemsByCategory(@Param("categoryId") categoryId: string): Promise<AppResponse> {
        return this.priorityTypesService.getItemsByCategory(Number(categoryId));
    }
}

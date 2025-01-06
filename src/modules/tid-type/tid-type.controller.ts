import {
    Body,
    Controller,
    Post,
    ValidationPipe,
    Put,
    Param,
    UseGuards,
    Get,
    Query,
    Delete,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { TidTypeService } from "./tid-type.service";
import { AddTidTypeDto, DeleteTidTypesDto, UpdateTidTypeDto } from "./dto/add-tid-type.dto";
import { ListTidTypesDto } from "src/shared/dtos/list-data.dto";


@ApiTags("TID Type")
@Controller("tid-type")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TidTypeController {
    constructor(private readonly tidTypeService: TidTypeService) { }

    @Post()
    @ApiOperation({ summary: "Add TID Type" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addTidType(
        @Body() createTidType: AddTidTypeDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.tidTypeService.addTidType(createTidType, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get TID Type list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTidTypeList(@Query() query: ListTidTypesDto): Promise<AppResponse> {
        return this.tidTypeService.getTidTypeList(query);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit TID Type details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "TidType Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editTidType(
        @Param("id") id: number,
        @Body(ValidationPipe) updateTidType: UpdateTidTypeDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tidTypeService.editTidType(updateTidType, id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete TID Types" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteTidTypes(@Body() tidTypes: DeleteTidTypesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.tidTypeService.deleteTidTypes(tidTypes, user.id);
    }

}

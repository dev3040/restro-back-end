import {
    Body,
    Controller,
    Post,
    Delete,
    ValidationPipe,
    Put,
    Param,
    UseGuards,
    Get,
    Query,
    Patch,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { LienMasterService } from "./lien-master.service";
import { AddLienMasterDto, DeleteLienMastersDto, UpdateLienMasterDto } from "./dto/add-lien-master.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { ListMasterLiensDto } from "src/shared/dtos/list-data.dto";

@ApiTags("Lien Master")
@Controller("lien-master")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class LienMasterController {
    constructor(private readonly lienMasterService: LienMasterService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create lien master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addLienMaster(@Body() createLienMaster: AddLienMasterDto, @GetUser() user: User): Promise<AppResponse> {
        return this.lienMasterService.addLienMaster(createLienMaster, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get lien master list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLienMasterList(@Query() query: ListMasterLiensDto): Promise<AppResponse> {
        return this.lienMasterService.getLienMasterList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get lien master details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLienMaster(@Param("id") id: string): Promise<AppResponse> {
        return this.lienMasterService.getLienMaster(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit lien master details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "LienMaster Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editLienMaster(@Param("id") id: string, @GetUser() user: User, @Body(ValidationPipe) updateLienMaster: UpdateLienMasterDto): Promise<AppResponse> {
        return this.lienMasterService.editLienMaster(updateLienMaster, id, user);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete lien master details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteLienMasters(@Body() deleteLienMaster: DeleteLienMastersDto, @GetUser() user: User): Promise<AppResponse> {
        return this.lienMasterService.deleteLienMasters(deleteLienMaster, user.id);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive Lien" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCustomer(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.lienMasterService.activeInactiveLien(id, user);
    }

}

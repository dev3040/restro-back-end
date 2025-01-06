import { Body, Controller, Get, Param, Patch, Post, Put, Query, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { Throttle } from "@nestjs/throttler";
import { PlateMasterService } from "./plate-master.service";
import { AddPlateMasterDto, UpdatePlateMasterDto } from "./dto/add-plate-master.dto";
import { User } from "src/shared/entity/user.entity";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ListPlatesDto } from "src/shared/dtos/list-data.dto";

@ApiTags("Plate Master")
@Controller('plate-master')
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Throttle(30, 60)
export class PlateMasterController {
    constructor(private readonly platerMasterService: PlateMasterService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Add plate master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    addPlateMaster(@Body() addPlateMasterDto: AddPlateMasterDto, @GetUser() user, @UploadedFiles() files): Promise<AppResponse> {
        return this.platerMasterService.addPlateMaster(addPlateMasterDto, user, files);
    }

    @Put(':id')
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Edit plate master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    updatePlateMaster(@Param('id') id: string, @Body() updatePlateMasterDto: UpdatePlateMasterDto, @GetUser() user, @UploadedFiles() files): Promise<AppResponse> {
        return this.platerMasterService.editPlateMaster(id, updatePlateMasterDto, user, files);
    }

    @Get("/")
    @ApiOperation({ summary: "Get plate list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getPriorityTypesList(@Query() query: ListPlatesDto): Promise<AppResponse> {
        return this.platerMasterService.fetchAllPlates(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get plate master by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getPlateMaster(@Param("id") id: string): Promise<AppResponse> {
        return this.platerMasterService.getPlateDetails(id);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive Plates" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCustomer(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.platerMasterService.activeInactivePlate(id, user);
    }

    @Get("/document/:id")
    @ApiOperation({ summary: "Download Document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadDOcument(@Param("id") id: string, @Res() res: Response): Promise<any> {
        return this.platerMasterService.downloadDocument(id, res);
    }

}
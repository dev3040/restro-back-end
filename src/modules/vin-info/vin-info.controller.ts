import { Body, Controller, ValidationPipe, Put, Param, UseGuards, Get, Delete, Post, UseInterceptors, UploadedFiles, Res, Query, Optional } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiCookieAuth, ApiConsumes, ApiQuery, ApiParam } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { UpdatePdfDataDto, UpdateVinInfoDto } from "../ticket-management/dto/add-vin-info.dto";
import { VinInfoService } from "./vin-info.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { SetVinInfoDto } from "../ticket-management/dto/set-vin-info.dto";
import { PageQueryDto } from "./dto/list-query.dto";
import { AddFMVMasterDTO } from "../ticket-management/dto/add-fmv-master.dto";
import { ParseIsSummaryPipe } from "src/shared/pipes/is-summary.pipe";
import { BulkDeleteDto } from "src/shared/dtos/bulk-delete.dto";
import { ListFmvDto } from "src/shared/dtos/list-data.dto";


@ApiTags("Vehicle Info")
@Controller("data-entry/vin-info")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class VinInfoController {
    constructor(private readonly vinInfoService: VinInfoService) { }

    @Put("/:id")
    @ApiOperation({ summary: "Save vin info" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @UseInterceptors(FilesInterceptor('attachments'))
    editVinInfo(
        @Param("id") id: number,
        @Body(ValidationPipe) vinInfo: UpdateVinInfoDto,
        @GetUser() user: User,
        @UploadedFiles() files
    ): Promise<AppResponse> {
        return this.vinInfoService.editVinInfo(vinInfo, id, user, files)
    }

    @Post("/fmv/:id/upload-documents")
    @ApiOperation({ summary: "Edit ticket details" })
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "FMV Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    uploadDocuments(
        @Param("id") id: string,
        @UploadedFiles() files,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.vinInfoService.uploadDocuments(id, user, files);
    }

    @Get("/colors")
    @ApiOperation({ summary: "Get vehicle colors" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getColors(
    ): Promise<AppResponse> {
        return this.vinInfoService.fetchColors()
    }

    @Get("/fmv-pdf-data")
    @ApiOperation({ summary: "Get fmv pdf data" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFmvPdfData(@Query() query: ListFmvDto): Promise<AppResponse> {
        return this.vinInfoService.fetchFmvPdfData(query)
    }

    @Get("/document/:id")
    @ApiOperation({ summary: "Download Document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadDOcument(@Param("id") id: string, @Res() res: Response): Promise<any> {
        return this.vinInfoService.downloadDocument(id, res);
    }

    @Delete("/document/:id")
    @ApiOperation({ summary: "Delete document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDocument(@Param("id") id: string, @GetUser() user: User): Promise<AppResponse> {
        return this.vinInfoService.deleteDocument(id, user.id);
    }

    @Get("/fmv/:vinNum")
    @ApiOperation({ summary: "Get fmv master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFmvMaster(
        @Param("vinNum") vinNum: string
    ): Promise<AppResponse> {
        return this.vinInfoService.fetchFMVMaster(vinNum)
    }

    @Get("/fmv-pdf-data/:id")
    @ApiOperation({ summary: "Get fmv pdf data by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFmvPdfDataById(@Param("id") id: number,): Promise<AppResponse> {
        return this.vinInfoService.fetchFmvPdfDataById(id)
    }

    @Delete("/fmv")
    @ApiOperation({ summary: "Delete FMV document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteFmv(@Body() deleteFMV: BulkDeleteDto, @GetUser() user: User): Promise<AppResponse> {
        return this.vinInfoService.deleteFmv(deleteFMV, user.id);
    }

    @Put("/set/:id")
    @ApiOperation({ summary: "Real time vehicle info by vinId of Ticket" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Vin info Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiQuery({ name: 'isSummary', required: false, type: Boolean, description: 'API called from Summary or not' })
    setVinInfo(
        @Query('isSummary', ParseIsSummaryPipe) isSummary: boolean,
        @Param("id") vinId: number,
        @Body(ValidationPipe) vinInfo: SetVinInfoDto,
        @GetUser() user: User,
        @UploadedFiles() files
    ): Promise<AppResponse> {
        return this.vinInfoService.setVinInfo(vinInfo, vinId, user.id, isSummary)
    }

    @Put("/fmv-pdf-data/:id")
    editFmvPdfData(
        @Param("id") id: number,
        @Body(ValidationPipe) fmvPdfData: UpdatePdfDataDto,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.vinInfoService.editPdfData(fmvPdfData, id, user)
    }

    @Put("/fmv/:id?")
    @ApiParam({ name: 'id', required: false, description: 'Optional ID' })
    editFmvData(
        @Param("id") @Optional() id: number,
        @Body(ValidationPipe) fmvData: AddFMVMasterDTO,
        @GetUser() user: User,
    ): Promise<AppResponse> {
        return this.vinInfoService.editData(fmvData, id, user)
    }

    @Get("/history/:vinNum")
    @ApiOperation({ summary: "Get fmv master" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getVinHistory(
        @Param("vinNum") vinNum: string,
        @Query() query: PageQueryDto
    ): Promise<AppResponse> {
        return this.vinInfoService.getVinHistory(vinNum, query)
    }
}

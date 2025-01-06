import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiConsumes, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BatchPrepService } from "./batch-prep.service";
import { User } from "src/shared/entity/user.entity";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { DeleteBatchPrepDto, GenerateBatchPrepRoundDto, SetBatchPrepDto } from "./dto/set-batch-prep.dto";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { BatchQueryDto, ProcessingCountsDto } from "./dto/batch-list.dto";
import { PageQueryDto } from "./dto/list-query.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { Response } from 'express';
import { FilesInterceptor } from "@nestjs/platform-express";
import { BatchHistoryDto } from "./dto/batch-history.dto";
import { BatchCommentsArrayDto } from "./dto/create-county-report.dto";
import { BatchIdsDto } from "./dto/batch-ids.dto";
import { GetSentToDmvListDto } from "./dto/get-sent-dmv-list.dto";
import { GetBatchReviewListDto } from "./dto/get-batch-review-list.dto";
import { GetIncompleteListDto } from "./dto/get-incomplete-list.dto";

@ApiTags("Batch Prep")
@Controller("batch-prep")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@ApiCookieAuth()
export class BatchPrepController {
    constructor(private readonly batchPrepService: BatchPrepService) { }

    @Put("/")
    @ApiOperation({ summary: "Set batch prep" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async setBatchPrep(
        @Body() setBatch: SetBatchPrepDto,
        @GetUser() user: User,
        @Query() query: { batchId: number }
    ): Promise<AppResponse> {
        return this.batchPrepService.setBatch(setBatch, user.id, query);
    }

    @Get()
    @ApiOperation({ summary: "Get batch prep list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getBatchPrepList(@Query() query: BatchQueryDto): Promise<AppResponse> {
        return this.batchPrepService.getBatchList(query);
    }

    @Get("/tickets")
    @ApiOperation({ summary: "Get ticket list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketList(@Query() query: PageQueryDto): Promise<AppResponse> {
        return this.batchPrepService.getTicketListByType(query);
    }

    @Delete()
    @ApiOperation({ summary: "Delete batch prep" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteBatchPrep(@Body() deleteBatch: DeleteBatchPrepDto): Promise<AppResponse> {
        return this.batchPrepService.deleteBatchPrep(deleteBatch);
    }

    @Get('/counts')
    @ApiOperation({ summary: "Get batch prep counts" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getBatchPrepCounts(@Query() query: ProcessingCountsDto): Promise<AppResponse> {
        return this.batchPrepService.getBatchPrepCounts(query);
    }

    @Post("/review")
    @ApiOperation({ summary: "Get review list of batches" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getBatchReviewList(@Body() dto: GetBatchReviewListDto): Promise<AppResponse> {
        return this.batchPrepService.getBatchReviewList(dto);
    }

    @Post("/incomplete")
    @ApiOperation({ summary: "Get list for Incompleted Batches" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getIncompleteList(@Body() dto: GetIncompleteListDto): Promise<AppResponse> {
        return this.batchPrepService.getIncompleteList(dto);
    }

    @Post("/sent-to-dmv")
    @ApiOperation({ summary: "Get list for Completed/Sent to DMV batches" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getSentToDmvList(@Body() dto: GetSentToDmvListDto): Promise<AppResponse> {
        return this.batchPrepService.getSentToDmvList(dto);
    }

    @Put("/create-batch")
    @ApiOperation({ summary: "Create batch" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async createBatchPrep(@Body() setBatch: CreateBatchDto, @GetUser() user: User, @Query() query: { batchId: number }): Promise<AppResponse> {
        return this.batchPrepService.createBatch(setBatch, user.id, query);
    }

    @Post("county-report")
    @ApiOperation({ summary: "Generate county report" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async generateCountyReport(@Body() comments: BatchCommentsArrayDto,
        @GetUser() user: User,
        @Res() res: Response
    ): Promise<AppResponse> {
        return this.batchPrepService.countyReport(comments, user.id, res);
    }

    @Post('generate')
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async generateCsv(@Body() { batchIds }: BatchIdsDto, @Res() res) {
        return this.batchPrepService.prepareCsv(res, batchIds);
    }

    @Post("upload-csv")
    @ApiOperation({ summary: "Edit ticket details" })
    @UseInterceptors(FilesInterceptor('attachments'))
    @ApiConsumes("multipart/form-data")
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    uploadDocuments(
        @Body() { batchIds }: BatchIdsDto,
        @UploadedFiles() files,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.batchPrepService.uploadDocuments(batchIds, user, files);
    }

    @Get("/document/:id")
    @ApiOperation({ summary: "Download Document" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadDOcument(@Param("id") id: string, @Res() res: Response): Promise<any> {
        return this.batchPrepService.downloadDocument(id, res);
    }

    @Delete("/document/:id")
    @ApiOperation({ summary: "Delete document" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteDocument(@Param("id") id: string, @GetUser() user: User): Promise<AppResponse> {
        return this.batchPrepService.deleteDocument(id, user.id);
    }

    @Get("/batch-history")
    @ApiOperation({ summary: "Get batch history list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getBatchHistoryList(@Query() query: BatchHistoryDto): Promise<AppResponse> {
        return this.batchPrepService.getBatchHistoryList(query);
    }

    @Post("counties")
    @ApiOperation({ summary: "Counties by group" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    countiesByGroup(@Body() dto: BatchIdsDto): Promise<AppResponse> {
        return this.batchPrepService.countiesByGroup(dto);
    }

    @Get(":id/county-report")
    @ApiOperation({ summary: "Download county report" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    downloadCountyReport(@Param("id") id: number, @Res() res: Response): Promise<any> {
        return this.batchPrepService.downloadCountyReport(id, res);
    }

    @Post("rounds")
    @ApiOperation({ summary: "Generate batch prep rounds" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    batchPrepRound(@Body() dto: GenerateBatchPrepRoundDto): Promise<AppResponse> {
        return this.batchPrepService.batchPrepRound(dto);
    }

    @Post("/generate-label")
    @ApiOperation({ summary: "submit ticket for batch prep" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async generateReturnLabel(@Body() batchIdsDto: BatchIdsDto, @GetUser() user: User): Promise<AppResponse> {
        return this.batchPrepService.generateReturnLabel(batchIdsDto.batchIds, user);
    }

    @Post("/fedex-flag")
    @ApiOperation({ summary: "Get fedex flag" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFedExFlagByGroup(@Body() { batchIds }: BatchIdsDto): Promise<AppResponse> {
        return this.batchPrepService.getFedExFlagByGroup(batchIds);
    }

    @Put("/sent-to-dmv")
    @ApiOperation({ summary: "Change ticket status after completing group" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    setSentToDmv(@Body() { batchIds }: BatchIdsDto, @GetUser() user: User): Promise<AppResponse> {
        return this.batchPrepService.setSentToDmv(batchIds, user);
    }

    @Get("/fedex-tracking-status/:id")
    @ApiOperation({ summary: "Get tracking status" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTrackingStatus(@Param("id") id): Promise<AppResponse> {
        return this.batchPrepService.getTrackingStatus(id);
    }

}
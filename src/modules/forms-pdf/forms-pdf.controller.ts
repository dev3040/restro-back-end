import { Body, Controller, UseGuards, Get, Query, Post, Res, Delete, Patch, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from 'express';
import { AuthGuard } from "@nestjs/passport";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { FormsPdfService } from "./forms-pdf.service";
import { AddFormsPdfDto, AddStampDto, DeleteStampDto, UpdateStampDto } from "./dto/add-forms-pdf.dto";
import { PageQueryDto, StampPageQueryDto } from "./dto/list-query.dto";

@ApiTags("Forms Pdf")
@Controller("forms-pdf")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class FormsPdfController {
    constructor(private readonly formsPdfService: FormsPdfService) { }

    @Post("/")
    @ApiOperation({ summary: "Generate forms PDF" })
    @ApiResponse({ status: 200, description: "API success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async generatePdf(
        @Body() formsPdf: AddFormsPdfDto,
        @Res() res: Response
    ): Promise<void> {
        return this.formsPdfService.createFormsPdf(formsPdf, res);
    }

    @Get("/")
    @ApiOperation({ summary: "Get forms list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFormsList(@Query() query: PageQueryDto): Promise<AppResponse> {
        return this.formsPdfService.getFormsList(query);
    }

    /*****************************************************  forms pdf stamp api  ***************************************************/

    @Get("/stamps")
    @ApiOperation({ summary: "Get forms stamp list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getFormsStampList(@Query() query: StampPageQueryDto): Promise<AppResponse> {
        return this.formsPdfService.getStampList(query);
    }

    @Post("/stamps")
    @ApiOperation({ summary: "Add stamp for pdf forms" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    addStamp(@Body() addStamp: AddStampDto, @GetUser() user: User): Promise<AppResponse> {
        return this.formsPdfService.addStamp(addStamp, user);
    }

    @Delete("/stamps")
    @ApiOperation({ summary: "Delete stamps" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteStamps(@Body() id: DeleteStampDto, @GetUser() user: User): Promise<AppResponse> {
        return this.formsPdfService.deleteStamps(id, user.id);
    }

    @Patch("/stamps/:id")
    @ApiOperation({ summary: "Update stamp" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    updateStamp(@Param("id") id: number, @Body() data: UpdateStampDto, @GetUser() user: User): Promise<AppResponse> {
        return this.formsPdfService.updateStamp(id, data, user.id);
    }


}

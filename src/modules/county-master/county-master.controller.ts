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
    Patch,
    Query,
    Optional,
    UseInterceptors,
    UploadedFile
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiConsumes } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AddCountyDto, DeleteCountiesDto, UpdateCountyDto } from "./dto/add-county.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";
import { CountyMasterService } from "./county-master.service";
import { PageQueryDto } from "src/shared/dtos/list-query.dto";
import { SaveCountyProfileDto } from "./dto/save-county-profile.dto";
import { AddContactDto, UpdateContactDto } from "./dto/add-contact.dto";
import { SaveCountyLinksDto } from "./dto/save-county-links.dto";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { AddCountyCheatSheetDto, UpdateCheatSheetDto } from "./dto/add-county-cheat-sheet.dto";
import { SaveCountyRatesDto } from "./dto/save-county-milage-rates.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadDocDto } from "./dto/file-upload.dto";
import { BulkDeleteDto } from "src/shared/dtos/bulk-delete.dto";
import { CountyProcessingDto, CountyTransactionWorkDto } from "./dto/county-processing.dto";
import { ListCountiesDto } from "src/shared/dtos/list-data.dto";

@ApiTags("County Master")
@Controller("county")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyMasterController {
    constructor(private readonly countyMasterService: CountyMasterService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create county" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addCounties(@Body() createCounty: AddCountyDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyMasterService.addCounties(createCounty, user);
    }


    @Get("/")
    @ApiOperation({ summary: "Get county list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCountyList(@Query() query: ListCountiesDto): Promise<AppResponse> {
        return this.countyMasterService.getCountyList(query);
    }

    @Get("/analytics/:countyId")
    @ApiOperation({ summary: "Get county analytics" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getAnalytics(@Param("countyId") countyId: number, @Query() query: AnalyticsQueryDto): Promise<AppResponse> {
        return this.countyMasterService.getAnalytics(countyId, query);
    }

    @Get("/tickets/:countyId")
    @ApiOperation({ summary: "Get ticket list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTicketList(@Query() query: PageQueryDto, @Param("countyId") countyId: number): Promise<AppResponse> {
        return this.countyMasterService.getTicketList(query, countyId);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get county details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCountyDetails(@Param("id") id: string): Promise<AppResponse> {
        return this.countyMasterService.getCountyDetails(id);
    }

    @Put("/county-profile/:countyId")
    @ApiOperation({ summary: "Edit county profile details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "county Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editCountyProfile(@Param("countyId") id: string, @Body(ValidationPipe) countyProfileDto: SaveCountyProfileDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyMasterService.editCountyProfile(countyProfileDto, id, user);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit county details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "county Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editCounty(@Param("id") id: string, @Body(ValidationPipe) updateDto: UpdateCountyDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyMasterService.editCounty(updateDto, id, user);
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete county" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteCounty(@Param("id") id: string): Promise<AppResponse> {
        return this.countyMasterService.deleteCounty(id);
    }

    @Delete("/")
    @ApiOperation({ summary: "Delete counties" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteCounties(@Body() deleteCounties: DeleteCountiesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyMasterService.deleteCounties(deleteCounties, user.id);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/ Inactive county" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCounty(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.countyMasterService.activeInactiveCounty(id, user);
    }

}

// ================County Contacts Apis==============

@ApiTags("County Contact")
@Controller("county-contact")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyContactController {

    constructor(private readonly countyContactService: CountyMasterService) { }

    @Post("/")
    @ApiOperation({ summary: "Create Contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addContact(@Body() createContact: AddContactDto, @GetUser() user: User
    ): Promise<AppResponse> {
        return this.countyContactService.addContact(createContact, user);
    }

    @Get("/list")
    @ApiOperation({ summary: "Get contact list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getContactList(@Query() query: PageQueryDto): Promise<AppResponse> {
        return this.countyContactService.getContactList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get contact details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getContact(@Param("id") id: number): Promise<AppResponse> {
        return this.countyContactService.getContact(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit contact details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editContact(@Param("id") id: string, @Body(ValidationPipe) updateCustomer: UpdateContactDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyContactService.editContact(updateCustomer, id, user);
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Active/Inactive contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveContact(@Param("id") id: number, @GetUser() user: User): Promise<AppResponse> {
        return this.countyContactService.activeInactiveContact(id, user);
    }


    @Delete("/")
    @ApiOperation({ summary: "Delete contact" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteContact(@Body() deleteContact: BulkDeleteDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyContactService.deleteContact(deleteContact, user.id);
    }

}

// ================County Links Apis==============

@ApiTags("County links")
@Controller("county-links")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyLinksController {

    constructor(private readonly countyLinksService: CountyMasterService) { }

    @Get("/list")
    @ApiOperation({ summary: "Get link list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLinkList(@Query() query: PageQueryDto): Promise<AppResponse> {
        return this.countyLinksService.getLinkList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get link details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getLink(@Param("id") id: number): Promise<AppResponse> {
        return this.countyLinksService.getLink(id);
    }

    @Post("/:id?")
    @ApiOperation({ summary: "Save link details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    @ApiParam({ name: 'id', required: false, description: 'Optional ID' })
    saveLink(@Param("id") @Optional() id: string, @Body(ValidationPipe) saveLinks: SaveCountyLinksDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyLinksService.saveLinks(saveLinks, id, user);
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete link" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteLink(@Param("id") id: NumberConstructor, @GetUser() user: User): Promise<AppResponse> {
        return this.countyLinksService.deleteLink(id, user);
    }



}

// county cheat sheet apis

@ApiTags("County CheatSheet")
@Controller("county-cheat-sheet")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()

export class CountyCheatSheetController {

    constructor(private readonly countyCheatSheetService: CountyMasterService) { }
    @Post("/add")
    @ApiOperation({ summary: "Create county cheet sheet" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addCounties(@Body() addCheatSheet: AddCountyCheatSheetDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyCheatSheetService.addCheatSheet(addCheatSheet, user);
    }


    @Get("/:countyId")
    @ApiOperation({ summary: "Get county cheet sheet by ID" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCountyList(@Param("countyId") countyId: number): Promise<AppResponse> {
        return this.countyCheatSheetService.getCheatSheet(countyId);
    }

    @Put("/:countyId")
    @ApiOperation({ summary: "Edit county cheet sheet details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editContact(@Param("countyId") countyId: string, @Body(ValidationPipe) updateCheatSheet: UpdateCheatSheetDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyCheatSheetService.editCheatSheet(updateCheatSheet, countyId, user);
    }
}

// ================County Milage rate Apis==============
@ApiTags("County Milage Rates")
@Controller("milage-rate")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyMilageRatesController {

    constructor(private readonly countyService: CountyMasterService) { }
    @Put("/:countyId")
    @ApiOperation({ summary: "Save new county milage rate" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async saveRates(@Param("countyId") countyId: string, @Body() ratesDto: SaveCountyRatesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyService.saveRates(ratesDto, countyId, user);
    }

    @Get("/:countyId")
    @ApiOperation({ summary: "Get county milage rate sheet by ID" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getCountyMilageRateList(@Param("countyId") countyId: number, @Query() query: PageQueryDto,): Promise<AppResponse> {
        return this.countyService.getRates(countyId, query);
    }

    @Post("/bulk")
    @ApiOperation({ summary: "Save new county milage rate" })
    @UseInterceptors(FileInterceptor('attachment'))
    @ApiConsumes("multipart/form-data")
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Tickets Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    uploadDocuments(
        @UploadedFile() file,
        @Body(ValidationPipe) upload: UploadDocDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.countyService.saveBulkRates(file, user, upload);
    }

    @Patch("/")
    @ApiOperation({ summary: "Active/ Inactive county milage rate" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    activeInactiveCounty(@Body() deleteMilage: BulkDeleteDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyService.activeInactiveCountyMilageRate(deleteMilage, user.id);
    }

}

// ================County Processing Apis==============
@ApiTags("County Processing")
@Controller("processing")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyProcessingController {
    constructor(private readonly countyService: CountyMasterService) { }
    @Put("/:countyId")
    @ApiOperation({ summary: "Save county processing details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async saveProcessingDetails(@Param("countyId") countyId: string, @Body() ratesDto: CountyProcessingDto, @GetUser() user: User): Promise<AppResponse> {
        return this.countyService.saveProcessingDetails(ratesDto, countyId, user);
    }

    @Get("/:countyId")
    @ApiOperation({ summary: "Get county processing by ID" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getProcessingDetails(@Param("countyId") countyId: number): Promise<AppResponse> {
        return this.countyService.getDetails(countyId);
    }
}

// ================County Transaction Works Apis==============
@ApiTags("County Transaction Works")
@Controller("transaction-works")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CountyTransactionWorkController {
    constructor(private readonly countyService: CountyMasterService) { }

    @Get("/:countyId")
    @ApiOperation({ summary: "Get county processing by ID" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getTransactionWorks(@Param("countyId") countyId: number, @Query() query: PageQueryDto): Promise<AppResponse> {
        return this.countyService.getTransactionWorks(countyId, query);
    }

    @Put("/:countyId/transaction/:transactionCode")
    @ApiOperation({ summary: "Save county transaction work" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async saveTransactionWorks(
        @Param("countyId") countyId: string,
        @Param("transactionCode") transactionCode: string,
        @Body() payload: CountyTransactionWorkDto,
        @GetUser() user: User
    ): Promise<AppResponse> {
        return this.countyService.saveTransactionWorks(transactionCode, countyId, payload, user);
    }
}
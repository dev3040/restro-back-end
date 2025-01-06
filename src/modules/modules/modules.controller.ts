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
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ModulesService } from "./modules.service";
import { AddModulesDto, UpdateModulesDto } from "./dto/add-modules.dto";
import { PageQueryDto } from "../../shared/dtos/list-query.dto";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { GetUser } from "src/shared/decorators/get-user.decorator";
import { User } from "src/shared/entity/user.entity";

@ApiTags("Modules Management")
@Controller("modules")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) { }

    @Post("/add")
    @ApiOperation({ summary: "Create Module" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    async addModules(@Body() createModules: AddModulesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.modulesService.addModules(createModules, user);
    }

    @Get("/")
    @ApiOperation({ summary: "Get modules list" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getModulesList(@Query() query: PageQueryDto): Promise<AppResponse> {
        return this.modulesService.getModulesList(query);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get modules details by id" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    getModules(@Param("id") id: string): Promise<AppResponse> {
        return this.modulesService.getModules(id);
    }

    @Put("/:id")
    @ApiOperation({ summary: "Edit modules details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 409, description: "Modules Already Exist" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    editModules(@Param("id") id: string, @Body(ValidationPipe) updateModules: UpdateModulesDto, @GetUser() user: User): Promise<AppResponse> {
        return this.modulesService.editModules(updateModules, id, user);
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete modules details" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    @ApiResponse({ status: 404, description: "Not found!" })
    @ApiResponse({ status: 500, description: "Internal server error!" })
    deleteModules(@Param("id") id: string, @GetUser() user: User): Promise<AppResponse> {
        return this.modulesService.deleteModules(id, user);
    }

}

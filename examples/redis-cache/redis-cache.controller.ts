import { Body, Controller, Delete, Get, Param, Post, Query, ValidationPipe } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RedisCacheService } from "./redis-cache.service";
import { GenericCacheDTO } from "../redis-cache/generic-cache.dto";

@ApiTags("RedisCache")
@Controller("redis-cache")
export class RedisCacheController {
    constructor(private readonly redisCacheService: RedisCacheService) {}

    @Post()
    @ApiOperation({ summary: "Add cache" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    addCache(@Body(ValidationPipe) dto: GenericCacheDTO) {
        return this.redisCacheService.addCache(dto);
    }

    @Delete("/:key")
    @ApiOperation({ summary: "Delete cache by key" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    deleteCache(@Param("key") key: string) {
        return this.redisCacheService.deleteCache(key);
    }

    @Get()
    @ApiOperation({ summary: "Get cache by key" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    findByKey(@Query() dto: GenericCacheDTO) {
        return this.redisCacheService.findByKey(dto);
    }

    @Post("reset-cache")
    @ApiOperation({ summary: "Reset cache" })
    @ApiResponse({ status: 200, description: "Api success" })
    @ApiResponse({ status: 406, description: "Not Acceptable error" })
    @ApiResponse({ status: 422, description: "Bad Request or API error message" })
    resetCache() {
        return this.redisCacheService.resetCache();
    }
}

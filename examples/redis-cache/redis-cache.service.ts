import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { GenericCacheDTO } from "../redis-cache/generic-cache.dto";

@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

    async addCache(dto: GenericCacheDTO) {
        const { key, value } = dto;
        const ttl = 86400; // 1 day
        try {
            await this.cacheManager.set(key, value, ttl);
            return {
                message: `Value for ${key} has been added successfully.`,
            };
        } catch (error) {
            throw new Error(`Failed to cache data for key ${key}`);
        }
    }

    async resetCache() {
        await this.cacheManager.reset();
        return {
            message: `Cache has been reset successfully.`
        };
    }

    async findByKey(dto: GenericCacheDTO) {
        const { key } = dto;

        const data = await this.cacheManager.get(key);
        return {
            data: data || null,
            message: data ? "This is loaded from redis cache." : `No cache found for Key: ${key}`,
        };
    }

    async deleteCache(key: string) {
        try {
            await this.cacheManager.del(key);
            return {
                message: `Cache has been deleted for Key: ${key}.`
            };
        } catch (error) {
            throw new Error(`Failed to cache data for key ${key}`);
        }

    }
}

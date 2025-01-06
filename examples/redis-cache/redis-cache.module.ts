import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisCacheService } from "./redis-cache.service";
import * as redisStore from "cache-manager-redis-store";
import { RedisCacheController } from "./redis-cache.controller";

@Module({
    imports: [
        CacheModule.register({
            store: typeof redisStore,
            host: process.env.REDIS_HOST || 'localhost', // localhost
            port: parseInt(process.env.REDIS_PORT, 10) || 6379, // Default to 6379 if not provided
            auth_pass: process.env.REDIS_PASSWORD, //undefined if not set
            db: 0,
            socket_port: process.env.SOCKET_PORT
        })
    ],
    controllers: [RedisCacheController],
    providers: [RedisCacheService],
    exports: [RedisCacheService]
})
export class RedisCacheModule { }

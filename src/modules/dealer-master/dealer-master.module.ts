import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DealerMasterService } from "./dealer-master.service";
import { DealerMasterController } from "./dealer-master.controller";
import { DealerMasterRepository } from "./dealer-master.repository";
import { RedisCacheModule } from "examples/redis-cache/redis-cache.module";
import { SellerInfoModule } from "../seller-info/seller-info.module";

@Module({
    imports: [RedisCacheModule,SellerInfoModule ],
    controllers: [DealerMasterController],
    providers: [DealerMasterService, ConfigService, DealerMasterRepository]
})
export class DealerMasterModule { }

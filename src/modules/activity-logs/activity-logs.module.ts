import { Module } from "@nestjs/common";
import { ActivityLogsController } from "./activity-logs.controller";
import { ActivityLogsRepository } from "./activity-logs.repository";
import { ActivityLogsService } from "./activity-logs.service";

@Module({
   controllers: [ActivityLogsController],
   providers: [
      ActivityLogsService,
      ActivityLogsRepository,
   ],
   exports: [ActivityLogsService],
})
export class ActivityLogsModule { }

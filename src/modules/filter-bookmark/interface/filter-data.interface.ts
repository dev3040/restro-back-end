import { TaskGroupByEnum } from "../../../shared/enums/task-group-by.enum";
import { FilterBookmarkTeams } from "src/shared/entity/filter-bookmark-teams.entity";
import { Tags } from "src/shared/entity/tags.entity";
import { PriorityTypes } from "src/shared/entity/priority-types.entity";
import { TicketStatuses } from "src/shared/entity/ticket-statuses.entity";

export interface BookmarkFilterData {
   groupBy?: TaskGroupByEnum;
   tagIds?: number[];
   priorityIds?: number[];
   statusIds?: number[];
}


export interface BookmarkFilterDetailsResponse {
   id: number;
   name: string;
   bookmarkTeam: FilterBookmarkTeams[];
   groupBy: TaskGroupByEnum | null;
   tags?: Tags[];
   statues?: TicketStatuses[];
   priorities?: PriorityTypes[];
}


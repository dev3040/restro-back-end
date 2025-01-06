import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { FilterBookmarks } from "src/shared/entity/filter-bookmark.entity";
import { throwException } from "src/shared/utility/throw-exception";
import { DataSource, In, Repository } from "typeorm";
import { CreateFilterBookmarkDto } from "./dto/create-bookmark.dto";
import { FilterBookmarkTeams } from "src/shared/entity/filter-bookmark-teams.entity";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { checkFilterBookmarkExists, getTeamSpecificUsers, getUserSpecificTeams } from "src/shared/utility/common-function.methods";
import { PriorityTypes } from "src/shared/entity/priority-types.entity";
import { TicketStatuses } from "src/shared/entity/ticket-statuses.entity";
import { Tags } from "src/shared/entity/tags.entity";
import { BookmarkFilterDetailsResponse } from "./interface/filter-data.interface";
import { UpdateBookmarkDto } from "./dto/update-bookmark.dto";

@Injectable()
export class FilterBookmarkRepository extends Repository<FilterBookmarks>  {
   constructor(
      readonly dataSource: DataSource,
      private socketGateway: SocketGateway
   ) {
      super(FilterBookmarks, dataSource.createEntityManager());
   }

   async createBookmark(createFilterBookmarkDto: CreateFilterBookmarkDto, userId: number): Promise<FilterBookmarks> {
      try {
         const { teamIds } = createFilterBookmarkDto;

         //check name duplication
         await this.checkBookmarkNameDuplication(createFilterBookmarkDto.name.toLowerCase())

         //save bookmark
         const newBookmark = await this.save(
            this.create({ ...createFilterBookmarkDto, createdBy: userId })
         );

         //save bookmark teams
         const bookmarkTeamsData = teamIds.map(elem => ({
            bookmarkId: newBookmark.id,
            teamId: elem,
            createdBy: userId
         }))
         await this.setBookmarkTeam(bookmarkTeamsData);

         const getBookmarkDetails = await this.getBookmarkData(newBookmark.id);

         /* ***********SOCKET EVENT*********** */
         // channel = user_id, event = "new_bookmark_created", data = new bookmark details 
         const users = await getTeamSpecificUsers(teamIds);
         users.forEach(element => {
            this.socketGateway.notify(element, SocketEventEnum.NEW_BOOKMARK_CREATED, getBookmarkDetails);
         })

         return getBookmarkDetails;

      } catch (error) {
         throwException(error);
      }
   }

   async editBookmark(id: number, updateBookmarkDto: UpdateBookmarkDto, userId: number) {
      try {
         await checkFilterBookmarkExists(id);

         let dto: any = {
            filterData: updateBookmarkDto.filterData,
            updatedBy: userId
         };

         if (updateBookmarkDto?.name) {
            await this.checkBookmarkNameDuplication(updateBookmarkDto.name.toLowerCase(), id)
            dto.name = updateBookmarkDto.name;
         }

         //update bookmark details
         await this.update(id, { ...dto });

         // team data
         if (updateBookmarkDto?.teamData) {
            const { newTeamIds, removeTeamIds } = updateBookmarkDto.teamData.reduce((acc, e) => {
               e.isAdd ? acc.newTeamIds.push(e.teamId) : acc.removeTeamIds.push(e.teamId);
               return acc;
            }, { newTeamIds: [], removeTeamIds: [] });

            // add
            if (newTeamIds.length) {
               const bookmarkTeamsData = newTeamIds.map(element => ({
                  teamId: element,
                  bookmarkId: id,
                  createdBy: userId
               }))
               await this.setBookmarkTeam(bookmarkTeamsData)
            }
            // remove
            if (removeTeamIds.length) {
               await this.removeBookmarkTeams(id, removeTeamIds)
            }
         }
      } catch (error) {
         throwException(error);
      }
   }

   //bookmark team mapping
   async setBookmarkTeam(data) {
      try {
         await this.manager.createQueryBuilder()
            .insert()
            .into(FilterBookmarkTeams)
            .values(data)
            .execute();
      } catch (error) {
         throw new BadRequestException(`ERR_STORING_DATA&&&bookmarkTeam&&&ERROR_MESSAGE`)
      }
   }

   async removeBookmarkTeams(bookmarkId: number, teamIds: number[]) {
      try {
         const query = this.manager.createQueryBuilder(FilterBookmarkTeams, 'bookmark')
            .delete()
            .where("bookmarkId = :bookmarkId", { bookmarkId })

         if (teamIds.length) {
            query.andWhere("(teamId IN (:...teamIds))", { teamIds })
         }

         await query.execute();
      } catch (error) {
         throw new BadRequestException(`ERR_DELETING_DATA&&&removeBookmarkTeams&&&ERROR_MESSAGE`);
      }
   }

   async fetchBookmarks(userId: number): Promise<{ filterBookmarks: FilterBookmarks[], totalResults: number }> {
      try {
         const response = {
            filterBookmarks: [],
            totalResults: 0
         }
         //get user specific teams 
         const userTeams = await getUserSpecificTeams(userId);
         if (!userTeams.length) {
            return response;
         }

         const [filterBookmarks, count] = await this.manager.createQueryBuilder(FilterBookmarks, "filterBookmark")
            .leftJoinAndSelect("filterBookmark.bookmarkTeam", "bookmarkTeam")
            .leftJoinAndSelect("bookmarkTeam.team", "team")
            .select([
               "filterBookmark.id", "filterBookmark.name", "filterBookmark.filterData",
               "bookmarkTeam.id", "bookmarkTeam.teamId",
               "team.id", "team.name"
            ])
            .innerJoin("filter_bookmark_teams", "bt", "bt.bookmarkId = filterBookmark.id AND bt.teamId IN (:...userTeams)")
            .setParameter("userTeams", userTeams)
            .orderBy('filterBookmark.id', 'ASC')
            .getManyAndCount();

         if (!filterBookmarks.length) {
            return response;
         }

         return { ...response, filterBookmarks, totalResults: count };

      } catch (error) {
         throwException(error);
      }
   }

   //basic details
   getBookmarkData(id: number): Promise<FilterBookmarks> {
      return this.manager.createQueryBuilder(FilterBookmarks, "filterBookmark")
         .leftJoinAndSelect("filterBookmark.bookmarkTeam", "bookmarkTeam")
         .leftJoinAndSelect("bookmarkTeam.team", "team")
         .select([
            "filterBookmark.id", "filterBookmark.name", "filterBookmark.filterData",
            "bookmarkTeam.id", "bookmarkTeam.teamId",
            "team.id", "team.name"
         ])
         .where(`("filterBookmark"."id" = :id)`, { id })
         .getOne();
   }

   //all details
   async fetchBookmarkDetails(id: number): Promise<BookmarkFilterDetailsResponse> {
      try {
         const filterBookmarkData = await this.manager.createQueryBuilder(FilterBookmarks, "filterBookmark")
            .leftJoinAndSelect("filterBookmark.bookmarkTeam", "bookmarkTeam")
            .leftJoinAndSelect("bookmarkTeam.team", "team")
            .select([
               "filterBookmark.id", "filterBookmark.name", "filterBookmark.filterData",
               "bookmarkTeam.id", "bookmarkTeam.teamId",
               "team.id", "team.name"
            ])
            .where("filterBookmark.id = :id", { id })
            .getOne();
         if (!filterBookmarkData) {
            throw new NotFoundException(`ERR_BOOKMARK_NOT_FOUND&&&id`);
         }

         const { filterData, ...response }: any = filterBookmarkData;
         response.groupBy = filterData.groupBy;

         const filterKeys = [
            { key: 'tagIds', type: 'tags' },
            { key: 'statusIds', type: 'statuses' },
            { key: 'priorityIds', type: 'priorities' }
         ];

         for (const element of filterKeys) {
            if (filterData?.[element.key]?.length) {
               response[element.type] = await this.findFilterValues(filterData[element.key], element.type);
            }
         }
         return response;

      } catch (error) {
         throwException(error);
      }
   }

   async findFilterValues(ids: number[], type: string) {
      try {
         const entityMap = {
            tags: Tags,
            priorities: PriorityTypes,
            statuses: TicketStatuses,
         };

         const selectMap = {
            tags: ['id', 'name'],
            priorities: ['id', 'name'],
            statuses: ['id', 'internalStatusName'],
         };

         if (entityMap[type]) {
            return await entityMap[type].find({
               select: selectMap[type],
               where: {
                  id: In(ids),
                  isDeleted: false,
               },
            });
         }
      } catch (error) {
         throwException(error);
      }
   }

   async checkBookmarkNameDuplication(name: string, id?: number) {
      try {
         const query = FilterBookmarks.createQueryBuilder("bookmark")
            .select(["bookmark.id", "bookmark.name"])
            .where(`(LOWER(bookmark.name) = :name)`, { name })

         if (id) {
            query.andWhere(`(bookmark.id != :id)`, { id })
         }

         const checkTransactionType = await query.getOne();

         if (checkTransactionType) {
            throw new ConflictException("ERR_BOOKMARK_NAME_EXIST&&&name");
         }
      } catch (error) {
         throwException(error)
      }
   }


}
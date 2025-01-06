import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterBookmarkRepository } from './filter-bookmark.respository';
import { AppResponse } from 'src/shared/interfaces/app-response.interface';
import { throwException } from 'src/shared/utility/throw-exception';
import { CreateFilterBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { FilterBookmarkTeams } from 'src/shared/entity/filter-bookmark-teams.entity';
import { getTeamSpecificUsers } from 'src/shared/utility/common-function.methods';
import { SocketEventEnum } from 'src/shared/enums/socket-event.enum';
import { SocketGateway } from '../socket/socket.gateway';


@Injectable()
export class FilterBookmarkService {

   constructor(
      @InjectRepository(FilterBookmarkRepository)
      private readonly filterBookmarkRepository: FilterBookmarkRepository,
      private socketGateway: SocketGateway
   ) { }

   async createBookmark(createFilterBookmarkDto: CreateFilterBookmarkDto, userId: number): Promise<AppResponse> {
      try {
         const data = await this.filterBookmarkRepository.createBookmark(createFilterBookmarkDto, userId);
         return {
            message: "SUC_FILTER_BOOKMARK_CREATED",
            data
         }
      } catch (error) {
         throwException(error);
      }
   }

   async editBookmark(id: number, updateBookmarkDto: UpdateBookmarkDto, userId: number): Promise<AppResponse> {
      try {
         await this.filterBookmarkRepository.editBookmark(id, updateBookmarkDto, userId);
         return {
            message: "SUC_FILTER_BOOKMARK_UPDATED",
            data: {}
         }
      } catch (error) {
         throwException(error);
      }
   }

   async getBookmarks(userId: number): Promise<AppResponse> {
      try {
         const data = await this.filterBookmarkRepository.fetchBookmarks(userId);
         return {
            message: "SUC_FILTER_BOOKMARKS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async getBookmarkDetails(id: number): Promise<AppResponse> {
      try {
         const data = await this.filterBookmarkRepository.fetchBookmarkDetails(id);

         return {
            message: "SUC_FILTER_BOOKMARK_DETAILS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async deleteBookmark(id: number): Promise<AppResponse> {
      try {
         //check bookmark exist
         const bookmarkExists = await this.filterBookmarkRepository.createQueryBuilder("filterBookmark")
            .leftJoinAndSelect("filterBookmark.bookmarkTeam", "bookmarkTeam")
            .select([
               "filterBookmark.id", "filterBookmark.name", "filterBookmark.filterData",
               "bookmarkTeam.id", "bookmarkTeam.teamId"
            ])
            .where("filterBookmark.id = :id", { id })
            .getOne();
         if (!bookmarkExists || bookmarkExists === null) {
            throw new NotFoundException(`ERR_BOOKMARK_NOT_FOUND&&&id`);
         }

         try {
            //delete bookmark teams
            await FilterBookmarkTeams.createQueryBuilder('filterBookmarkTeams')
               .delete()
               .where("bookmarkId = :id", { id })
               .execute();

            //delete bookmark
            await this.filterBookmarkRepository.createQueryBuilder('filterBookmark')
               .delete()
               .where("id = :id", { id })
               .execute();
         } catch (error) {
            throw new BadRequestException(`ERR_DELETING_DATA&&&id&&&ERROR_MESSAGE`)
         }

         /**********SOCKET EVENT**********/
         //channel = user_id, event = "new_bookmark_created", data = new bookmark details 
         const teams = bookmarkExists?.bookmarkTeam?.map(e => parseInt(e.teamId));
         if (teams.length) {
            const users = await getTeamSpecificUsers(teams);
            users.forEach(element => {
               this.socketGateway.notify(element, SocketEventEnum.BOOKMARK_DELETED, id);
            })
         }

         return {
            data: {},
            message: `SUC_FILTER_BOOKMARK_DELETED`
         }
      } catch (error) {
         throwException(error)
      }
   }
}
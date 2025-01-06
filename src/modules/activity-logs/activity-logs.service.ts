import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ActivityLogsRepository } from "./activity-logs.repository";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { CommentMentions } from "src/shared/entity/comment-mention.entity";
import { ActivityLogs } from "src/shared/entity/activity-logs.entity";
import { activityMentionConversion, checkTicketExists, findTicket, mentionedUserFunction } from "src/shared/utility/common-function.methods";
import { ActivityLogPayload } from "./activity-log.interface";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { SocketGateway } from "../socket/socket.gateway";
import { AddActivityCommentDto } from "./dto/add-activity-comment.dto";
import { User } from "src/shared/entity/user.entity";
import { GetActivityLogsDto } from "./dto/get-activity-logs.dto";

@Injectable()
export class ActivityLogsService {

   constructor(
      @InjectRepository(ActivityLogsRepository)
      private readonly activityLogsRepository: ActivityLogsRepository,
      private socketGateway: SocketGateway
   ) { }

   async getActivityComments(query): Promise<AppResponse> {
      try {
         const ticketId = parseInt(query?.ticketId);
         await findTicket(ticketId);

         let data;
         let message: string;

         if (query.isOnlyComments === 'true') {
            //fetch only comments
            data = await this.activityLogsRepository.getAllComments(ticketId);
            message = "SUC_ACTIVITY_COMMENTS_FETCHED"
         } else {
            //fetch comments & log ids
            data = await this.activityLogsRepository.getCommentsAndLogIds(query, ticketId);
            message = "SUC_ACTIVITY_LOGS_FETCHED";
         }

         return {
            message,
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async getActivityLogs(dto: GetActivityLogsDto): Promise<AppResponse> {
      try {
         const data = await this.activityLogsRepository.getActivityLogs(dto.id);
         return {
            message: "SUC_ACTIVITY_LOGS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }

   async addActivityLog(data, mentions, socketEvent: SocketEventEnum, isSeparateLogs?: boolean) {
      try {
         const { fieldName } = data;

         let socketData;
         let ticketId: number;
         let logs: [ActivityLogs];

         const res = await ActivityLogs.createQueryBuilder()
            .insert()
            .into(ActivityLogs)
            .values(data)
            .execute();
         const activityLog = res.identifiers.map(e => e.id);

         if (activityLog.length) {
            /* If comment then add store comment mentioned users */
            if (fieldName == "activity comment") {
               await this.saveCommentMention(activityLog[0], mentions);

               socketData = await this.activityLogsRepository.createQueryBuilder("activity")
                  .leftJoinAndSelect("activity.createdByUser", "user")
                  .leftJoinAndSelect("activity.commentMention", "commentMention")
                  .leftJoinAndSelect("commentMention.mentionedUser", "mentionedUser")
                  .select([
                     "activity.id", "activity.ticketId", "activity.fieldName", "activity.newData", "activity.oldData", "activity.actionType", "activity.userId", "activity.formType", "activity.createdAt",
                     "user.id", "user.firstName", "user.lastName", "user.email",
                     "commentMention.id", "commentMention.mentionUserId",
                     "mentionedUser.id", "mentionedUser.firstName", "mentionedUser.lastName", "mentionedUser.email"
                  ])
                  .where("(activity.id = :activityId)", { activityId: activityLog[0] })
                  .orderBy("commentMention.id", "ASC")
                  .getOne();

               if (socketData?.commentMention?.length) {
                  await activityMentionConversion(socketData, socketData.commentMention.map(e => e.mentionUserId), true)
               }
               ticketId = socketData?.ticketId;
               logs = [socketData]

            } else {
               socketData = await this.activityLogsRepository.getActivityLogs(activityLog);
               ticketId = socketData?.logs[0]?.ticketId;
               logs = socketData?.logs;
            }
            /* ************************ SEND SOCKET TRIGGER  **************************/
            if (socketEvent !== null) {
               // channel = ticket_id, event = "ticket_data_add", data = activity log data
               if (!isSeparateLogs) {
                  this.socketGateway.notify(ticketId, socketEvent, logs);
               } else {
                  for (const log of socketData.logs) {
                     this.socketGateway.notify(log.ticketId, socketEvent, [log]);
                  }
               }
            }
         }
         return socketData;
      } catch (error) {
         throw new BadRequestException(`${error}&&&&&&ERROR_MESSAGE`);
      }
   }

   async addComment(commentData) {
      try {
         const data: ActivityLogPayload = {
            userId: commentData?.user?.id || commentData?.userId,
            actionType: ActivityLogActionType.TICKET_DATA_ADD,
            ticketId: commentData.ticketId,
            fieldName: "activity comment",
            newData: commentData.comment,
            oldData: null,
            formType: null
         }
         await this.addActivityLog(data, commentData.mentions, SocketEventEnum.TICKET_DATA_ADD);

      } catch (error) {
         throwException(error);
      }
   }

   async addActivityComment(addComment: AddActivityCommentDto, user: User) {
      try {
         const { ticketId, comment, mentions } = addComment;
         await checkTicketExists(ticketId);

         const data: ActivityLogPayload = {
            userId: user.id,
            actionType: ActivityLogActionType.TICKET_DATA_ADD,
            ticketId: ticketId,
            fieldName: "activity comment",
            newData: comment,
            oldData: null,
            formType: null
         }
         const res = await this.addActivityLog(data, mentions, SocketEventEnum.TICKET_DATA_ADD);

         return {
            message: "SUC_ACTIVITY_COMMENT_ADDED",
            data: res
         };
      } catch (error) {
         throwException(error);
      }
   }

   async saveCommentMention(activityLogId, mentions) {
      try {
         /************* COMMENT MENTION ************* */
         const activity = await ActivityLogs.findOne({
            select: ["id", "newData"],
            where: { id: activityLogId }
         })
         if (mentions) {
            /* add comment mentions */
            const { finalMentions } = await mentionedUserFunction(activity?.newData, mentions);

            if (finalMentions?.length) {
               const arr = finalMentions.map(element => {
                  return {
                     commentId: activity.id,
                     mentionUserId: element
                  }
               })
               try {
                  await CommentMentions.createQueryBuilder()
                     .insert()
                     .into(CommentMentions)
                     .values(arr)
                     .execute();
               } catch (err) {
                  throw new BadRequestException(`INVALID_MENTION&&&newData&&&ERROR_MESSAGE`)
               }
            }
         }
      } catch (error) {
         throwException(error);
      }
   }

   async getCommentsAndNotes(ticketId: number): Promise<AppResponse> {
      try {
         const data = await this.activityLogsRepository.getCommentsAndNotes(ticketId);
         return {
            message: "SUC_ACTIVITY_LOGS_FETCHED",
            data
         };
      } catch (error) {
         throwException(error);
      }
   }
}
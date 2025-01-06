import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { ActivityLogs } from 'src/shared/entity/activity-logs.entity';
import { activityMentionConversion, getUser } from 'src/shared/utility/common-function.methods';
import { ActivityLogActionType } from 'src/shared/enums/activity-action-type.enum';
import { minActivityCommentsLimit } from 'src/config/common.config';
import { Tickets } from 'src/shared/entity/tickets.entity';


@Injectable()
export class ActivityLogsRepository extends Repository<ActivityLogs> {
   constructor(
      readonly dataSource: DataSource) {
      super(ActivityLogs, dataSource.createEntityManager());
   }

   //show more functionality with pagination of comments: comments + log ids [1]
   async getCommentsAndLogIds(filterDto, ticketId: number): Promise<{ logs: ActivityLogs[], totalResults: number, stopScrollFlag: boolean }> {
      try {
         const response = [];
         const limit = parseInt(filterDto?.limit) || minActivityCommentsLimit; // Number of comments per page
         const skip = filterDto?.offset ? (limit * parseInt(filterDto?.offset)) : 0; //skip comments
         let firstLogId = null;
         let firstCommentId = null;
         let stopScrollFlag = false;
         let firstLogWhere = null;
         const ticketIdWhereCondition = `(activityLog.ticket_id = ${ticketId})`
         const selectActivityLogId = `activityLog.id`;

         // Pagination wise comments of the ticket
         const paginatedQuery = await this.manager.createQueryBuilder(ActivityLogs, "activityLog")
            .select(selectActivityLogId)
            .where(ticketIdWhereCondition)
            .andWhere("activityLog.field_name = :activityType", { activityType: "activity comment" })
            .orderBy(selectActivityLogId, "DESC")
            .take(limit)
            .skip(skip)
            .getMany();

         //Fetch first log of the ticket
         const getFirstLog = await this.manager.createQueryBuilder(ActivityLogs, "activityLog")
            .select(selectActivityLogId)
            .where(ticketIdWhereCondition)
            .orderBy(selectActivityLogId, 'ASC')
            .getOne();
         if (getFirstLog) {
            firstLogId = getFirstLog.id;
            firstLogWhere = `(activityLog.id > ${firstLogId} OR activityLog.id = ${firstLogId})`;
         }

         if (!paginatedQuery.length) {
            /* *************************************************************************************
            Scenario- We need ticket's 1st log & 1st Comment Because 
                     Either we need to fetch all logs OR logs that are created prior to 1st comment.
            *************************************************************************************** */

            // Fetch first comment of the ticket
            const firstComment = await this.manager.createQueryBuilder(ActivityLogs, "activityLog")
               .select(selectActivityLogId)
               .where(ticketIdWhereCondition)
               .andWhere("activityLog.field_name = :activityType", { activityType: "activity comment" })
               .orderBy(selectActivityLogId, "ASC")
               .getOne();
            firstCommentId = firstComment?.id || null;
         }

         const query = this.manager.createQueryBuilder(ActivityLogs, "activityLog")
            .leftJoinAndSelect("activityLog.createdByUser", "user")
            .leftJoinAndSelect("activityLog.commentMention", "commentMention")
            .leftJoinAndSelect("commentMention.mentionedUser", "mentionedUser")
            .select([
               "activityLog.id", "activityLog.ticketId", "activityLog.fieldName", "activityLog.newData",
               "activityLog.userId", "activityLog.createdAt", "activityLog.actionType",
               "commentMention.id", "commentMention.mentionUserId",
               "user.id", "user.firstName", "user.lastName", "user.email",
               "mentionedUser.id", "mentionedUser.firstName", "mentionedUser.lastName", "mentionedUser.email"
            ])
            .where(ticketIdWhereCondition)

         if (paginatedQuery.length) {
            /* If too less comments then need to send all logs */
            const totalCommentsCount = await this.count({
               where: { fieldName: "activity comment", ticketId: ticketId }
            })
            if (totalCommentsCount <= minActivityCommentsLimit) {
               if (firstLogId) {
                  query.andWhere(firstLogWhere)
               }
               stopScrollFlag = true
            } else {
               //records will be fetched according to comment's min & max id because comments exist
               const minId = paginatedQuery?.at(-1)?.id || null;
               const maxId = skip !== 0 ? paginatedQuery?.[0]?.id : null; //from page 2 we need to apply pagination

               if (minId) {
                  query.andWhere(`(activityLog.id > :minId OR activityLog.id = :minId)`, { minId })
               }
               if (maxId) {
                  query.andWhere(`(activityLog.id < :maxId OR activityLog.id = :maxId)`, { maxId })
               }
            }
         } else {
            //records will be fetched upto ticket's 1st comment OR all logs.           
            if (firstLogId) {
               query.andWhere(firstLogWhere)
            }
            if (firstCommentId) {
               query.andWhere(`(activityLog.id < :firstCommentId)`, { firstCommentId })
            }
            stopScrollFlag = true;
         }

         const [logs, count] = await query.orderBy(selectActivityLogId, "DESC")
            .addOrderBy("commentMention.id", "ASC")
            .getManyAndCount();

         if (!logs.length) {
            return {
               logs: [],
               totalResults: 0,
               stopScrollFlag
            };
         }
         return this.processLogs(logs, count, response, stopScrollFlag);

      } catch (error) {
         throwException(error);
      }
   }

   //show more functionality [2] : logs data
   async getActivityLogs(activityIds: number[]): Promise<{ logs: ActivityLogs[], totalResults: number }> {
      try {
         let [logs, count] = await this.manager.createQueryBuilder(ActivityLogs, "activity")
            .leftJoinAndSelect("activity.createdByUser", "user")
            .select([
               "activity.id", "activity.ticketId", "activity.fieldName", "activity.newData", "activity.oldData", "activity.actionType", "activity.userId", "activity.formType", "activity.createdAt",
               "user.id", "user.firstName", "user.lastName", "user.email"
            ])
            .where("(activity.id IN (:...activityIds))", { activityIds })
            .orderBy("activity.id", "ASC")
            .getManyAndCount();
         if (!logs.length) {
            return { logs, totalResults: count };
         }

         const resArr = [];
         for (let element of logs) {
            const response: any = element;

            if (element.fieldName === "assignee") {
               const id = parseInt((element.actionType == ActivityLogActionType.TICKET_DATA_REMOVE) ? element.oldData : element.newData) || null;
               if (id) {
                  response.assignee = await getUser(id);
               }
            }
            resArr.push(response);
         }

         return { logs: resArr, totalResults: count };
      } catch (error) {
         throwException(error);
      }
   }

   // manipulate response as per requirement => comments + log id array [1.2]
   private async processLogs(logs: ActivityLogs[], count: number, response: any[], stopScrollFlag: boolean) {
      try {
         let currentIds = [];
         for (let i = logs.length - 1; i >= 0; i--) {
            const log = logs[i];
            if (log.fieldName === "activity comment") {
               if (currentIds.length > 0) {
                  /* ************************************************************************
                  keep a series of log ids separated by comments in response array
                  after pushing data, blank out currentIds to store another group of log ids. 
                  ************************************************************************** */
                  response.push({ "activity_logs": currentIds });
                  currentIds = [];
               }
               if (log.commentMention?.length) {
                  await activityMentionConversion(log, log.commentMention.map(mention => mention.mentionUserId), true);
               }
               response.push(log);
            } else {
               currentIds.push(log.id);
            }
         }
         //check if current ids array still has any elements then add it into response
         if (currentIds.length > 0) {
            response.push({ "activity_logs": currentIds });
         }

         return {
            logs: response,
            totalResults: count,
            stopScrollFlag
         };
      } catch (error) {
         throwException(error)
      }
   }

   // Fetch Only comments 
   async getAllComments(ticketId: number): Promise<{ logs: ActivityLogs[], totalResults: number }> {
      try {
         const query = this.manager.createQueryBuilder(ActivityLogs, "activityLog")
            .leftJoinAndSelect("activityLog.createdByUser", "user")
            .leftJoinAndSelect("activityLog.commentMention", "commentMention")
            .leftJoinAndSelect("commentMention.mentionedUser", "mentionedUser")
            .select([
               "activityLog.id", "activityLog.ticketId", "activityLog.fieldName", "activityLog.newData",
               "activityLog.userId", "activityLog.createdAt", "activityLog.actionType",
               "commentMention.id", "commentMention.mentionUserId",
               "user.id", "user.firstName", "user.lastName", "user.email",
               "mentionedUser.id", "mentionedUser.firstName", "mentionedUser.lastName", "mentionedUser.email"
            ])
            .where(`(activityLog.ticket_id = :ticketId)`, { ticketId })
            .andWhere("activityLog.field_name = :activityType", { activityType: "activity comment" })


         const [comments, count] = await query.orderBy(`activityLog.id`, "DESC")
            .addOrderBy("commentMention.id", "ASC")
            .getManyAndCount();

         if (comments.length) {
            for (let element of comments) {
               await activityMentionConversion(element, element.commentMention.map(mention => mention.mentionUserId), true);
            }
         }

         return {
            logs: comments,
            totalResults: count,
         };
      } catch (error) {
         throwException(error);
      }
   }

   async getCommentsAndNotes(ticketId: number, ignoreComments?: boolean) {
      try {
         // fetch notes
         const ticket = await this.manager.createQueryBuilder(Tickets, "ticket")
            .leftJoinAndSelect("ticket.billingInfo", "billingInfo")
            .leftJoinAndSelect("ticket.customer", "customer")
            .select([
               "ticket.customerId",
               "billingInfo.billingNote", "billingInfo.runnerNote",
               "customer.billingNote"
            ])
            .where(`(ticket.id = :ticketId AND ticket.isDeleted = false)`, { ticketId })
            .getOne();

         if (!ticket) {
            throw new NotFoundException(`ERR_TICKET_NOT_FOUND&&&ticketId`)
         }

         let comments;

         if (!ignoreComments) {
            // fetch comments
            comments = await this.getAllComments(ticketId);
         }

         return {
            notes: ticket,
            comments: comments?.logs || []
         };
      } catch (error) {
         throwException(error);
      }
   }


}

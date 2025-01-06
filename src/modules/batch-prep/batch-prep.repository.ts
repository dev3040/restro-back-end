import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { join } from "path";
import * as fs from 'fs';
import * as htmlToPdf from 'html-pdf-node';
import { BatchPrepMapping } from "src/shared/entity/batch-prep-mapping.entity";
import { throwException } from "src/shared/utility/throw-exception";
import { Between, Brackets, DataSource, In, Repository } from "typeorm";
import { PageQueryDto } from "./dto/list-query.dto";
import { Tickets } from "src/shared/entity/tickets.entity";
import { CountyProcessingTypes, TicketTypes, WorksType } from "src/shared/enums/county-location.enum";
import { BatchQueryDto } from "./dto/batch-list.dto";
import { checkCountyExists, checkTicketExists, getProcessingDate, fedExShipmentJson, convertToNumberIfNumeric, checkBatchExists } from "src/shared/utility/common-function.methods";
import { SlugConstants } from "src/shared/constants/common.constant";
import { InjectRepository } from "@nestjs/typeorm";
import { CountyProcessing } from "src/shared/entity/county-processing.entity";
import { Batches } from "src/shared/entity/batch.entity";
import { BatchGroups } from "src/shared/entity/batch-group.entity";
import { User } from "src/shared/entity/user.entity";
import { editFileName, pathExistence } from "src/shared/helper/file-validators";
import { batchDocuments } from "src/config/common.config";
import * as path from 'path';
import csvParser from "csv-parser";
import { InvoiceChecks } from "src/shared/entity/invoice-checks.entity";
import { generateColumn, updateBatchHistory } from "./helper/helper";
import { BatchHistory } from "src/shared/entity/batch-history.entity";
import { TicketStatuses } from "src/shared/entity/ticket-statuses.entity";
import { ConfigService } from "@nestjs/config";
import { FedExConfig } from "src/shared/entity/fedex-config.entity";
import axios from "axios";
import { BatchHistoryPdfStatus } from "src/shared/enums/batch-history.enum";
import { FedExDocuments } from "src/shared/entity/fedex-labels.entity";
import { GetBatchReviewListDto } from "./dto/get-batch-review-list.dto";
import { BatchCommentsArrayDto } from "./dto/create-county-report.dto";


@Injectable()
export class BatchPrepRepository extends Repository<BatchPrepMapping> {
    constructor(readonly dataSource: DataSource,
        @InjectRepository(Batches)
        private batchRepository: Repository<Batches>,
        @InjectRepository(BatchPrepMapping)
        private batchPrepMappingRepository: Repository<BatchPrepMapping>,
        @InjectRepository(BatchGroups)
        private batchGroupsRepository: Repository<BatchGroups>,
        private readonly configService: ConfigService,
    ) {
        super(BatchPrepMapping, dataSource.createEntityManager());
    }
    async setBatch(batch, userId, query) {
        try {
            const { countyIds, ticketIds, cityIds } = batch;
            let batchExist;
            if (query.batchId) {
                batchExist = await Batches.findOne({ where: { id: query.batchId } })
            }
            await Promise.all([
                ...countyIds.map(id => checkCountyExists(id)),
                ...ticketIds.map(id => checkTicketExists(id))
            ]);

            // Bulk delete based on county, ticket, and city IDs
            await this.manager.createQueryBuilder()
                .delete()
                .from(BatchPrepMapping)
                .where('county_id IN (:...countyIds)', { countyIds })
                .andWhere('ticket_id IN (:...ticketIds)', { ticketIds })
                .andWhere(new Brackets(qb => {
                    qb.where('city_id IS NULL').orWhere('city_id IN (:...cityIds)', { cityIds });
                }))
                .execute();

            // Entities to insert
            const entitiesToInsert = countyIds.map((countyId, index) => ({
                countyId,
                ticketId: ticketIds[index],
                cityId: cityIds[index],
                createdBy: userId,
                batchId: batchExist?.countyId == countyId && batchExist?.cityId == cityIds[index] ? batchExist.id : null
            }));

            const uniqueEntitiesToInsert = entitiesToInsert.filter((entity, index, self) =>
                index === self.findIndex(e => e.ticketId === entity.ticketId && e.cityId === entity.cityId));

            await this.manager.createQueryBuilder()
                .insert()
                .into(BatchPrepMapping)
                .values(uniqueEntitiesToInsert)
                .execute();

        } catch (error) {
            throwException(error);
        }
    }

    async getBatchPrep(filterDto?: BatchQueryDto) {
        const { countyProcessingType, offset, limit, batchId } = filterDto;
        try {
            const query = this.manager.createQueryBuilder(BatchPrepMapping, "batch")
                .leftJoin("batch.county", "county")
                .leftJoin("batch.city", "city")
                .leftJoin(
                    "county.countyProcessing",
                    "countyProcessing",
                    `(
                        (batch.cityId IS NOT NULL AND countyProcessing.cityId = batch.cityId) OR 
                        (batch.cityId IS NULL AND countyProcessing.cityId IS NULL)
                    )`,
                )
                .leftJoin("batch.ticket", "ticket")
                .leftJoin("ticket.tavtForm", "form")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.customer", "customer")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .leftJoin("ticket.ticketStatus", "ticketStatus")
                .select([
                    "batch.id",
                    "batch.batchId AS batchId",
                    "county.id AS countyId",
                    "county.name AS countyName",
                    "city.id AS cityId",
                    "city.districtName AS cityName",
                    "countyProcessing.id AS cpId",
                    "countyProcessing.renewalWorks AS renewalWorks",
                    "countyProcessing.titleWorks AS titleWorks",
                    "countyProcessing.dropRenewalWorks AS dropRenewalWorks",
                    "countyProcessing.dropTitleWorks AS dropTitleWorks",
                    "countyProcessing.workRounds AS walkRoundLimit",
                    "countyProcessing.dropWorkRounds AS dropRoundLimit",
                    "countyProcessing.worksType AS worksType",
                    "countyProcessing.dropWorksType AS dropWorksType",
                    "countyProcessing.type AS type",
                    "countyProcessing.titleOrRenewalTotal AS titleOrRenewalTotal",
                    "countyProcessing.dropTitleOrRenewalTotal AS dropTitleOrRenewalTotal",
                    "countyProcessing.isDuplicateRound AS isDuplicateRound",
                    "countyProcessing.isMin AS isMin",
                    "ticket.processingType AS processingType",
                    `JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'batchPrepId', batch.id,
                            'ticketId', ticket.id, 
                            'customerId', ticket.customerId, 
                            'processingType', ticket.processingType, 
                            'vinId', ticket.vinId, 
                            'invoiceId', ticket.invoiceId,
                            'vinNumber', vinInfo.vinNumber, 
                            'customerName', customer.name,
                            'transactionTypeName', transactionType.name,
                            'transactionTypeCode', transactionType.transactionCode,
                            'finalTotal', (form.cost_calc::jsonb->'subTotalCalc'->>'finalTotal')::numeric,
                            'isIgnore', false
                        ) 
                        ORDER BY batch.id ${filterDto?.orderDir} 
                    ) AS tickets`
                ]).orderBy('batch.id', filterDto?.orderDir);

            query.andWhere("((batch.batchId IS NULL AND ticketStatus.slug = :slug) or batch.batchId = :batchId)", { slug: SlugConstants.ticketStatusReadyForBatchPrep, batchId: batchId || null });
            //grouping and ordering
            query
                .distinctOn(["ticket.id", "batch.id"])
                .groupBy(
                    "county.id, county.name, city.id, city.districtName, " +
                    "batch.id, countyProcessing.id, countyProcessing.renewalWorks, countyProcessing.titleWorks, " +
                    "countyProcessing.workRounds, countyProcessing.dropRenewalWorks, " +
                    "countyProcessing.dropTitleWorks, countyProcessing.dropWorkRounds, " +
                    "countyProcessing.type, countyProcessing.worksType, countyProcessing.dropWorksType, " +
                    "countyProcessing.titleOrRenewalTotal, countyProcessing.dropTitleOrRenewalTotal, " +
                    "countyProcessing.isDuplicateRound, " +
                    "countyProcessing.isMin, " + "ticket.id, ticket.processingType"
                );


            query.andWhere(
                new Brackets(qb => {
                    qb.where(
                        "ticket.processingType IS NOT NULL AND CAST(ticket.processingType AS TEXT) = CAST(:countyProcessingType AS TEXT)",
                        { countyProcessingType }
                    )
                        .orWhere(
                            "ticket.processingType IS NULL AND CAST(countyProcessing.type AS TEXT) = CAST(:countyProcessingType AS TEXT)",
                            { countyProcessingType }
                        );
                })
            );

            if (limit !== 0) {
                query.offset(offset * limit);
                query.limit(limit);
            }

            const processingDate = await getProcessingDate();
            const data = await query.getRawMany();

            data.forEach(result => {
                if (typeof result.tickets === 'string') {
                    result.tickets = JSON.parse(result.tickets);
                }
            });

            const results = data.reduce((acc, result) => {
                const groupedTickets = result.tickets.reduce((groupAcc, ticket) => {
                    const processingType = ticket.processingType || result.type;

                    let group = groupAcc.find(g => g.type === processingType && g.countyId === result.countyid &&
                        (g.cityId === result.cityid || (!g.cityId && !result.cityid)));
                    if (!group) {
                        group = {
                            batchId: result?.batchid || null,
                            countyId: result.countyid,
                            cityId: result.cityid || null,
                            cityName: result.cityname || null,
                            countyName: result.countyname,
                            renewalWorks: result.renewalworks,
                            titleWorks: result.titleworks,
                            dropRenewalWorks: result.droprenewalworks,
                            dropTitleWorks: result.droptitleworks,
                            walkRoundLimit: result.walkroundlimit,
                            dropRoundLimit: result.droproundlimit,
                            worksType: result.workstype,
                            dropWorksType: result.dropworkstype,
                            type: processingType,
                            titleOrRenewalTotal: result.titleorrenewaltotal,
                            dropTitleOrRenewalTotal: result.droptitleorrenewaltotal,
                            isDuplicateRound: result.isduplicateround,
                            isMin: result.ismin,
                            tickets: []
                        };
                        groupAcc.push(group);
                    }

                    group.tickets.push(ticket);
                    return groupAcc;
                }, []);

                groupedTickets.forEach(group => {
                    const existingGroup = acc.find(c => c.countyId === group.countyId && c.type === group.type &&
                        (c.cityId === group.cityId || (!c.cityId && !group.cityId)));

                    if (existingGroup) {
                        existingGroup.tickets.push(...group.tickets);
                    } else {
                        acc.push({
                            ...group
                        });
                    }
                });

                return acc;
            }, []);

            return { results, processingDate, page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteBatchPrep(deleteBatch) {
        try {
            const { ticketIds, batchId } = deleteBatch;

            const queryBuilder = this.dataSource.createQueryBuilder().delete().from(BatchPrepMapping);
            let statusId: any = null;
            if (ticketIds?.length > 0) {
                statusId = await TicketStatuses.findOne({
                    where: { slug: SlugConstants.ticketStatusReadyForBatchPrep },
                    select: ['id'],
                });
            }

            if (statusId) {  // Update ticket statuses
                await Tickets.createQueryBuilder()
                    .update()
                    .set({ ticketStatusId: statusId })
                    .where('id IN (:...ticketIds)', { ticketIds })
                    .execute();
            }

            if (ticketIds?.length > 0) {
                await queryBuilder
                    .where("ticketId IN (:...ticketIds) AND (batchId = :batchId OR batchId IS NULL)", {
                        ticketIds,
                        batchId: batchId ?? null,
                    })
                    .execute();
            }

            return { message: "SUC_BATCH_PREP_DELETED" };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchTickets(query: PageQueryDto): Promise<any> {
        try {
            const listQueryConditions = [];
            const parametersArray = [];

            // Helper function to query tickets by type
            const getTicketsByType = async (ticketType) => {
                const listQuery = this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                    .leftJoinAndSelect("ticket.customer", "customer")
                    .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                    .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                    .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                    .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                    .leftJoinAndSelect("buyerInfo.county", "county")
                    .leftJoinAndSelect("county.state", "state")
                    .leftJoinAndSelect("county.countyProcessing", "countyProcessing")
                    .leftJoinAndSelect("countyProcessing.city", "city")
                    .leftJoinAndSelect("ticket.batchPrepMapping", "batchPrepMapping")
                    .select([
                        "ticket.id", "ticket.ticketStatusId", "ticket.customerId", "ticket.priorityId", "ticket.carrierTypesId",
                        "ticket.trackingId", "ticket.docReceivedDate", "ticket.isActive", "ticket.purchaseDate", "ticket.invoiceId",
                        "ticket.processingType",
                        "ticket.sentToBatchPrep", "ticket.startDate", "ticketStatus.id", "ticketStatus.internalStatusName",
                        "ticketStatus.slug", "ticketStatus.order", "vinInfo.id", "vinInfo.vinNumber", "customer.id", "customer.name",
                        "customer.email", "basicInfo.id", "basicInfo.transactionTypeId", "transactionType.id", "transactionType.name",
                        "transactionType.transactionCode", "buyerInfo.countyId", "buyerInfo.district", "county.stateId", "county.name",
                        "city.districtName", "state.code", "countyProcessing.type", "countyProcessing.cityId", "countyProcessing.id",
                        "batchPrepMapping.id"
                    ])
                    .where("batchPrepMapping.batchId IS NULL")
                    .andWhere(
                        new Brackets(qb => {
                            qb.where(qb1 => {
                                const subQuery = qb1
                                    .subQuery()
                                    .select("id")
                                    .from("county.county_milage", "cm")
                                    .where("cm.district_name ILIKE buyerInfo.district") // Parameterized district value
                                    .getQuery();

                                return `
                              CASE
                                WHEN EXISTS (
                                  SELECT 1
                                  FROM "county"."county_processing" as "countyProcessing"
                                  WHERE "countyProcessing"."city_id" IN (${subQuery})
                                ) THEN "countyProcessing"."city_id" IN (${subQuery})
                                ELSE "countyProcessing"."city_id" IS NULL
                              END
                            `;
                            });
                        }),
                    )
                    .andWhere(
                        new Brackets(qb => {
                            qb.where("CAST(ticket.processingType AS TEXT) = CAST(:ticketType AS TEXT)", { ticketType })
                                .orWhere("CAST(countyProcessing.type AS TEXT) = CAST(:ticketType AS TEXT) AND ticket.processingType IS NULL", { ticketType });
                        })
                    )
                    .andWhere("ticket.isDeleted = false AND ticket.isActive = true AND buyerInfo.county IS NOT NULL")
                    .andWhere("ticketStatus.slug = :statusSlug", { statusSlug: SlugConstants.ticketStatusReadyForBatchPrep })


                //search filter
                if (query.search) {
                    listQuery.andWhere(new Brackets(qb => {
                        qb.where(`(customer.name ILIKE :search) 
                                   OR (LOWER(vinInfo.vinNumber) ILIKE :exactSearch) 
                                   OR (LOWER(ticket.invoiceId) ILIKE :exactSearch)
                                   OR (transactionType.name ILIKE :search)
                                   OR (county.name ILIKE :search)
                                   OR (buyerInfo.district ILIKE :search)`,
                            { search: `%${query.search}%`, exactSearch: query.search.toLowerCase() });

                        // Numeric search for ticket.id
                        if (!isNaN(parseInt(query.search))) {
                            const exactId = parseInt(query.search);
                            qb.orWhere("ticket.id = :exactId", { exactId });
                        }
                    }));
                }

                //date filter
                const applyDateFilter = (field, from, to) => {
                    if (from && to) {
                        const condition = from === to
                            ? `DATE(${field}) = :fromDate`
                            : `(${field} BETWEEN :fromDate AND :toDate OR DATE(${field}) = :fromDate OR DATE(${field}) = :toDate)`;

                        listQueryConditions.push(condition);
                        parametersArray.push({ fromDate: from, toDate: to });
                    }
                };
                applyDateFilter("ticket.docReceivedDate", query.fromDocReceivedDate, query.toDocReceivedDate);
                applyDateFilter("ticket.purchaseDate", query.fromPurchaseDate, query.toPurchaseDate);
                applyDateFilter("ticket.sentToBatchPrep", query.fromSentToBatchPrepDate, query.toSentToBatchPrepDate);
                applyDateFilter("ticket.startDate", query.fromTaskStartDate, query.toTaskStartDate);

                listQueryConditions.forEach(condition => {
                    listQuery.andWhere(condition);
                });
                if (parametersArray.length) {
                    listQuery.setParameters(Object.assign({}, ...parametersArray))
                }

                // Set ordering and pagination
                listQuery.offset(query.offset * query.limit);
                listQuery.limit(query.limit);
                listQuery.orderBy(`ticket.${query.orderBy}`, query.orderDir);

                // Get the tickets and count for the specific type
                const [tickets, count] = await listQuery.getManyAndCount();

                return {
                    tickets,
                    page: {
                        offset: query.offset,
                        limit: query.limit,
                        count,
                    }
                };
            };

            const result: any = {};
            result.allTickets = {};
            if (query.ticketType == TicketTypes.WALK) {
                result.walk = await getTicketsByType(TicketTypes.WALK);

            } else if (query.ticketType == TicketTypes.DROP) {
                result.drop = await getTicketsByType(TicketTypes.DROP);

            } else if (query.ticketType == TicketTypes.MAIL) {
                result.mail = await getTicketsByType(TicketTypes.MAIL);

            } else {
                result.walk = await getTicketsByType(TicketTypes.WALK)
                result.drop = await getTicketsByType(TicketTypes.DROP);
                result.mail = await getTicketsByType(TicketTypes.MAIL);

                let rawTicketsQuery = await this.manager.createQueryBuilder(Tickets, "ticket")
                    .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                    .leftJoinAndSelect("ticket.buyerInfo", "buyerInfo", "buyerInfo.isDeleted = false")
                    .leftJoinAndSelect("buyerInfo.county", "county")
                    .leftJoinAndSelect("ticket.batchPrepMapping", "batchPrepMapping")
                    .leftJoinAndSelect("county.countyProcessing", "countyProcessing")
                    .select([
                        "ticket.id AS ticketId",
                        "ticket.processingType AS ticketProcessingType",
                        "buyerInfo.countyId AS countyId",
                        "countyProcessing.type AS processingType",
                        "countyProcessing.cityId AS cityId",
                        "countyProcessing.type AS type"
                    ])
                    .where("ticket.isDeleted = false AND ticket.isActive = true")
                    .andWhere("buyerInfo.county IS NOT NULL")
                    .andWhere("ticketStatus.slug = :statusSlug",
                        { statusSlug: SlugConstants.ticketStatusReadyForBatchPrep })
                    .andWhere("batchPrepMapping.batchId IS NULL")

                listQueryConditions.forEach(condition => {
                    rawTicketsQuery.andWhere(condition);
                });
                if (parametersArray.length) {
                    rawTicketsQuery.setParameters(Object.assign({}, ...parametersArray))
                }

                const allTicketsData = await rawTicketsQuery.getRawMany();

                /**
                 * Transforms an array of ticket data into an object with processing type as the keys 
                 * and arrays of ticket data as the values.
                 * 
                 * @param {any[]} tickets - An array of ticket data objects.
                 * @returns {Record<string, { ticketId: string, countyId: number, cityId: number, processingType: number }[]>} - An object with processing type as the keys and arrays of ticket data as the values.
                 */
                const transformResponse = (tickets) => {
                    return tickets.reduce((acc, ticket) => {

                        const ticketProcessingType = parseInt(ticket?.ticketprocessingtype) || parseInt(ticket?.processingtype);

                        const processingTypeMap: Record<number, string> = {
                            1: 'walk',
                            2: 'drop',
                            3: 'mail',
                        };
                        const processingType = processingTypeMap[ticketProcessingType] || 'unknown';

                        if (!acc[processingType]) {
                            acc[processingType] = [];
                        }
                        acc[processingType].push({
                            ticketId: ticket.ticketid,
                            countyId: ticket.countyid,
                            cityId: ticket.cityid,
                            processingType: ticketProcessingType
                        });
                        return acc;
                    }, {});
                };

                const allTickets = transformResponse(allTicketsData);
                result.allTickets = allTickets;
            }
            return result;

        } catch (error) {
            throwException(error);
        }
    }

    async getBatchPrepCount(query) {
        try {
            const queryBuilder = this.manager.createQueryBuilder(BatchPrepMapping, "batch")
                .leftJoin("batch.county", "county")
                .leftJoin("batch.ticket", "ticket")
                .leftJoin("batch.city", "city")
                .leftJoin("county.countyProcessing", "countyProcessing", `
                    (
                        (batch.cityId IS NOT NULL AND countyProcessing.cityId = batch.cityId) OR 
                        (batch.cityId IS NULL AND countyProcessing.cityId IS NULL)
                    )`)
                .leftJoin("batch.createdByUser", "createdByUser")
                .select([
                    "batch.id AS batchPrepId",
                    "county.name AS countyName",
                    "city.districtName AS cityName",
                    "SUM(CASE WHEN COALESCE(CAST(ticket.processingType AS TEXT), CAST(countyProcessing.type AS TEXT)) = '1' THEN 1 ELSE 0 END) AS walkCount",
                    "SUM(CASE WHEN COALESCE(CAST(ticket.processingType AS TEXT), CAST(countyProcessing.type AS TEXT)) = '2' THEN 1 ELSE 0 END) AS dropCount",
                    "SUM(CASE WHEN COALESCE(CAST(ticket.processingType AS TEXT), CAST(countyProcessing.type AS TEXT)) = '3' THEN 1 ELSE 0 END) AS mailCount",
                    "batch.createdAt AS createdAt",
                    "batch.createdBy AS createdBy",
                    "batch.batchId AS batchId",
                    "createdByUser.id AS createdByUserId",
                    "createdByUser.firstName AS createdByUserFirstName"
                ]);

            if (query.batchId) {
                queryBuilder.where("(batch.batchId IS NULL or batch.batchId = :batchId)", { batchId: query.batchId });
            } else {
                queryBuilder.where("batch.batchId IS NULL");
            }

            queryBuilder.groupBy("batch.id, county.name, city.districtName, batch.createdAt, batch.createdBy, createdByUser.id, createdByUser.firstName");

            // Fetch data
            const data = await queryBuilder.getRawMany();
            let aggregatedResult = {
                walk: { count: "0", createdAt: null, createdBy: null, createdByUser: null },
                drop: { count: "0", createdAt: null, createdBy: null, createdByUser: null },
                mail: { count: "0", createdAt: null, createdBy: null, createdByUser: null },
            };

            // aggregate counts
            data.forEach(row => {
                if (parseInt(row.walkcount || "0") > 0) {
                    aggregatedResult.walk.count = (parseInt(aggregatedResult.walk.count) + parseInt(row.walkcount)).toString();
                    aggregatedResult.walk.createdAt = row?.createdat;
                    aggregatedResult.walk.createdBy = row?.createdby;
                    aggregatedResult.walk.createdByUser = {
                        id: row?.createdbyuserid,
                        firstName: row?.createdbyuserfirstname,
                    };
                }

                if (parseInt(row.dropcount || "0") > 0) {
                    aggregatedResult.drop.count = (parseInt(aggregatedResult.drop.count) + parseInt(row.dropcount)).toString();
                    aggregatedResult.drop.createdAt = row?.createdat;
                    aggregatedResult.drop.createdBy = row?.createdby;
                    aggregatedResult.drop.createdByUser = {
                        id: row?.createdbyuserid,
                        firstName: row?.createdbyuserfirstname,
                    };
                }

                if (parseInt(row.mailcount || "0") > 0) {
                    aggregatedResult.mail.count = (parseInt(aggregatedResult.mail.count) + parseInt(row.mailcount)).toString();
                    aggregatedResult.mail.createdAt = row?.createdat;
                    aggregatedResult.mail.createdBy = row?.createdby;
                    aggregatedResult.mail.createdByUser = {
                        id: row?.createdbyuserid,
                        firstName: row?.createdbyuserfirstname,
                    };
                }
            });

            return aggregatedResult;
        } catch (error) {
            throwException(error);
        }
    }

    async createBatch(dto, userId, query) {
        try {
            const batchEntries = [];
            const batchAssignedStatus = await TicketStatuses.findOne({ where: { slug: SlugConstants.ticketBatchAssigned }, select: ["id"] });
            if (batchAssignedStatus) {
                const statusId = batchAssignedStatus.id;
                const ticketIds = dto.batches.map(batch => batch.ticketId).filter(id => id !== null);

                if (ticketIds.length > 0) {
                    await Tickets.createQueryBuilder()
                        .update()
                        .set({ ticketStatusId: statusId })
                        .where('id IN (:...ticketIds)', { ticketIds })
                        .execute();
                }
            }
            let groupId;
            if (query.batchId) {
                const batchExist = await Batches.findOne({ where: { id: query.batchId } });
                groupId = batchExist.groupId;
                batchEntries.push(batchExist)
            } else {
                const batchGroup = await this.batchGroupsRepository.save({ createdBy: userId });
                groupId = batchGroup.id;
            }

            const groupedBatches = {};
            dto.batches.forEach(batch => {
                const { countyId, cityId, processingType, ticketId, walkDateProcessing, dropDateProcessing, mailDateProcessing } = batch;
                const groupKey = `${countyId}|${cityId}|${processingType}`;

                if (!groupedBatches[groupKey]) {
                    groupedBatches[groupKey] = {
                        countyId,
                        cityId,
                        processingType,
                        tickets: [],
                        walkDateProcessing: walkDateProcessing || null,
                        dropDateProcessing: dropDateProcessing || null,
                        mailDateProcessing: mailDateProcessing || null,
                    };
                }

                groupedBatches[groupKey].tickets.push(ticketId);
            });


            const batchIdMapping = {};

            for (const groupKey in groupedBatches) {
                const { countyId, cityId, processingType, tickets, walkDateProcessing, dropDateProcessing, mailDateProcessing } = groupedBatches[groupKey];

                const processingDates = {
                    walkDateProcessing: processingType === CountyProcessingTypes.WALK ? walkDateProcessing : null,
                    dropDateProcessing: processingType === CountyProcessingTypes.DROP ? dropDateProcessing : null,
                    mailDateProcessing: processingType === CountyProcessingTypes.MAIL ? mailDateProcessing : null,
                };

                const dateProcessing = Object.values(processingDates).find(date => date !== null);
                const batch = await this.batchRepository.save({
                    countyId, cityId, groupId,
                    processingType,
                    dateProcessing,
                    createdBy: userId,
                    ...processingDates,
                });

                tickets.forEach(ticketId => {
                    batchIdMapping[ticketId] = batch.id;
                });

                batchEntries.push(batch);
            }

            await this.updateBatchPrepMapping(
                dto.batches.map(batch => batch.countyId),
                dto.batches.map(batch => batch.ticketId),
                dto.batches.map(batch => batch.cityId),
                batchIdMapping
            );

            const result = batchEntries.reduce(
                (acc, item) => {
                    if (item.processingType === TicketTypes.WALK) acc.walk.push(item.id);
                    if (item.processingType === TicketTypes.MAIL) acc.mail.push(item.id);
                    if (item.processingType === TicketTypes.DROP) acc.drop.push(item.id);
                    return acc;
                },
                { walk: [], mail: [], drop: [] }
            );
            return { groupId, batchIds: result };
        } catch (error) {
            throwException(error);
        }
    }
    async updateBatchPrepMapping(countyIds, ticketIds, cityIds, batchIdMapping) {
        try {
            const batchPrepMappings = await this.batchPrepMappingRepository.find({
                where: [
                    { countyId: In(countyIds), cityId: In(cityIds) },
                    { countyId: In(countyIds), cityId: null },
                ],
            });

            if (!batchPrepMappings || batchPrepMappings.length === 0) {
                return;
            }

            const caseStatement = batchPrepMappings
                .map(({ ticketId, countyId, cityId }) => {
                    const batchId = batchIdMapping[ticketId];

                    if (batchId) {
                        return `WHEN ticketId = ${ticketId} AND countyId = ${countyId} AND (${cityId ? `cityId = ${cityId}` : 'cityId IS NULL'}) THEN ${batchId}`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join(' ');

            if (!caseStatement) {
                return;
            }

            const updateQuery = this.batchPrepMappingRepository
                .createQueryBuilder()
                .update()
                .set({
                    batchId: () => `CASE ${caseStatement} ELSE batchId END`,
                })
                .where('countyId IN (:...countyIds)', { countyIds })
                .andWhere('ticketId IN (:...ticketIds)', { ticketIds });

            await updateQuery.execute();
        } catch (error) {
            throwException(error);
        }
    }

    async fetchBatchReviewList(dto: GetBatchReviewListDto): Promise<any> {
        try {
            const query = this.manager.createQueryBuilder(Batches, "batch")
                .leftJoin("batch.county", "county")
                // .leftJoin("county.countyProcessing", "countyProcessing",
                //     // "countyProcessing.countyId = batch.countyId AND countyProcessing.cityId = batch.cityId"
                // )
                .leftJoin(
                    "county.countyProcessing", "countyProcessing",
                    `(
                        (batch.cityId IS NOT NULL AND countyProcessing.cityId = batch.cityId) OR 
                        (batch.cityId IS NULL AND countyProcessing.cityId IS NULL)
                    )`,
                )
                .leftJoin("batch.batchPrepMapping", "batchPrepMapping")
                .leftJoin("batch.fedExDocuments", "fedExDocuments", "fedExDocuments.isDeleted = false")
                .leftJoin("batchPrepMapping.ticket", "ticket")
                .leftJoin("ticket.customer", "customer")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .leftJoin(
                    qb => qb
                        .select("invoiceChecks.ticketId", "ticket_id")
                        .addSelect(
                            "json_agg(json_build_object('check_num', invoiceChecks.checkNum, 'amount', invoiceChecks.amount)) AS check_details"
                        )
                        .from("InvoiceChecks", "invoiceChecks")
                        .groupBy("invoiceChecks.ticketId"),
                    "invoiceCheckAggregates", `"invoiceCheckAggregates"."ticket_id" = "ticket"."id"`
                )
                .leftJoin(
                    qb => qb
                        .select("fedExDocuments.ticketId", "ticket_id")
                        .addSelect("json_agg(json_build_object('tracking_number', fedExDocuments.trackingNumber)) AS fedex_details")
                        .from("FedExDocuments", "fedExDocuments")
                        .groupBy("fedExDocuments.ticketId"),
                    "fedExDocumentsAggregates",
                    `"fedExDocumentsAggregates"."ticket_id" = "ticket"."id"`
                )
                .select([
                    "batch.id AS batch_id",
                    // "batch.countyId AS batch_county_id",
                    // "batch.cityId AS batch_city_id",
                    "batch.walkDateProcessing AS batch_walkDateProcessing",
                    "batch.dropDateProcessing AS batch_dropDateProcessing",
                    "batch.mailDateProcessing AS batch_mailDateProcessing",
                    "batch.dateProcessing AS batch_date_processing",
                    "county.id AS county_id",
                    "county.name AS county_name",
                    "countyProcessing.notes AS county_notes",
                    "fedExDocuments.file_name as fedExDocuments_file_name",
                    "fedExDocuments.id as fedExDocuments_id",
                    "fedExDocuments.tracking_number as fedExDocuments_tracking_number",
                    "COUNT(ticket.id) AS ticket_count",
                    `COALESCE(
                        json_agg(
                            json_build_object(
                                'b_mapping_id', batchPrepMapping.id,
                                'ticket_id', ticket.id,
                                'purchase_date', ticket.purchaseDate,
                                'doc_received_date', ticket.docReceivedDate,
                                'start_date', ticket.startDate,
                                'estimation_fees', ticket.estimationFees,
                                'invoice_id', ticket.invoiceId,
                                'vin_id', vinInfo.id,
                                'vin_number', vinInfo.vinNumber,
                                'basic_info_id', basicInfo.id,
                                'transaction_id', transactionType.id,
                                'transaction_name', transactionType.name,
                                'customer_id', customer.id,
                                'customer_name', customer.name,
                                'check_details', COALESCE("invoiceCheckAggregates".check_details, '[]'),
                                'fedex_details', COALESCE("fedExDocumentsAggregates".fedex_details, '[]')
                            )
                                ORDER BY batchPrepMapping.id DESC
                        ) FILTER (WHERE ticket.id IS NOT NULL), '[]'
                    ) AS tickets`
                ])
                .andWhere("batch.processingType = :ticketType", { ticketType: dto.ticketType });

            let countQuery: any = query;

            if (dto) {
                // batch id filter
                if (dto?.batchIds?.length) {
                    query.andWhere("batch.id IN (:...batchIds)", { batchIds: dto.batchIds });
                }

                //processing date filter
                if (dto.processingFromDate && dto.processingToDate) {
                    if (dto.processingFromDate === dto.processingToDate) {
                        query.andWhere(`(DATE(batch.dateProcessing) = :sameDate)`,
                            { sameDate: dto.processingFromDate }
                        )
                    } else {
                        query.andWhere(`((DATE(batch.dateProcessing) BETWEEN :fromDate AND :toDate) 
                        OR (DATE(batch.dateProcessing) = :fromDate OR DATE(batch.dateProcessing) = :toDate))`, { fromDate: dto.processingFromDate, toDate: dto.processingToDate });
                    }
                }

                //county filter
                if (dto.countyIds?.length) {
                    query.andWhere("county.id IN (:...countyIds)", { countyIds: dto.countyIds });
                }

                //customer filter
                if (dto.customerIds?.length) {
                    query.andWhere("customer.id IN (:...customerIds)", { customerIds: dto.customerIds });
                }

                //transaction type filter
                if (dto.transactionTypeIds?.length) {
                    query.andWhere("transactionType.id IN (:...transactionTypeIds)", { transactionTypeIds: dto.transactionTypeIds });
                }

                let integerSearch;
                let parametersArray = [];
                let listQueryConditions = [];

                //search filter
                if (dto.search) {
                    let searchCondition = `(customer.name ILIKE :search)
                        OR (transactionType.name ILIKE :search) 
                        --OR (invoiceChecks.checkNum ILIKE :search)
                        OR (transactionType.transactionCode ILIKE :search)
                        OR (county.name ILIKE  :search)
                        OR (LOWER(vinInfo.vinNumber) ILIKE :search) 
                        OR (LOWER(ticket.invoiceId) ILIKE :search)`;

                    const params: any = { search: `%${dto.search}%` };

                    //if search value is number then filter for ticket's id
                    integerSearch = convertToNumberIfNumeric(dto.search);

                    if (typeof integerSearch === 'number') {
                        searchCondition = `(
                            "batchPrepMapping"."ticket_id"::text ILIKE '%${integerSearch}%'
                            OR "batch"."id"::text ILIKE '%${integerSearch}%'
                            --OR "invoiceChecks"."amount"::text ILIKE '%${integerSearch}%'
                            ) 
                            OR ` + searchCondition;

                        params.integerSearch = integerSearch;
                    }

                    listQueryConditions.push(`(${searchCondition})`);
                    parametersArray.push(params);
                }

                listQueryConditions.forEach(condition => {
                    query.andWhere(condition);
                });
                if (parametersArray.length) {
                    query.setParameters(Object.assign({}, ...parametersArray))
                }
            }

            const count = await countQuery.getCount();

            const batches = await query.groupBy("batch.id, county.id, fedExDocuments.id, countyProcessing.notes")
                .orderBy("batch.id", "DESC")
                .offset(dto.offset * dto.limit)
                .limit(dto.limit)
                .getRawMany();

            // Post-process each batch to group tickets by transaction type
            const transformedBatches = batches.map(batch => {
                const { tickets, ...batchData } = batch;

                // Group tickets by transaction_id & transaction_name using a Map for efficiency
                const transactionGroups = new Map();

                tickets.forEach(ticket => {
                    const transactionKey = `${ticket.transaction_id}_${ticket.transaction_name}`;

                    //If transaction type is not present in the map, assign it
                    if (!transactionGroups.has(transactionKey)) {
                        transactionGroups.set(transactionKey, {
                            transaction_id: ticket.transaction_id,
                            transaction_name: ticket.transaction_name,
                            tickets: []
                        });
                    }

                    transactionGroups.get(transactionKey).tickets.push(ticket); //get transaction type & add ticket 
                });

                // Convert the Map values to an array 
                return {
                    batch: batchData,
                    transactions: Array.from(transactionGroups.values())
                };
            });
            const batchCsvFlag = await InvoiceChecks.createQueryBuilder('invoice')
                .where('invoice.batchId IN (:...batchIds)', { batchIds: dto.batchIds })
                .select('COUNT(DISTINCT invoice.batchId)', 'count')
                .getRawOne();
            let generateFedexLabel: any;
            if (dto.ticketType == TicketTypes.MAIL) {
                generateFedexLabel = await FedExDocuments.createQueryBuilder('labels')
                    .where('labels.batchId IN (:...batchIds)', { batchIds: dto.batchIds })
                    .select('COUNT(DISTINCT labels.batchId)', 'count')
                    .getRawOne();
            }
            return {
                batches: transformedBatches,
                page: {
                    count,
                    ...dto,
                    // batchGroup,
                    generateFedexLabel: dto.batchIds.length == generateFedexLabel?.count,
                    isDocumentUploaded: dto.batchIds.length == batchCsvFlag.count
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async generateCountyReport(batch: BatchCommentsArrayDto, userId: number): Promise<Buffer | null> {
        let status = BatchHistoryPdfStatus.IN_PROGRESS;
        let fileName: string | null = null;
        const timeoutLimit = 9000; // 9 sec
        let pdfBuffer: Buffer | null = null;
        const { batchIds } = batch;
        try {

            if (batch.comments.length > 0) {
                const caseStatement = batch.comments
                    .map(({ batchId, comment }) => `WHEN id = :batchId_${batchId} THEN :comment_${batchId}`)
                    .join(' ');

                const batchIds = batch.comments.map(({ batchId }) => batchId).join(', ');

                const parameters = {};
                batch.comments.forEach(({ batchId, comment }) => {
                    parameters[`batchId_${batchId}`] = batchId;
                    parameters[`comment_${batchId}`] = comment;
                });

                await this.dataSource
                    .createQueryBuilder()
                    .update('batch_prep.batches')
                    .set({ comment: () => `CASE ${caseStatement} END` })
                    .where(`id IN (${batchIds})`)
                    .setParameters(parameters)
                    .execute();
            }

            const cssPath = join(process.cwd(), 'src/pdf-html/styles.css');
            const cssContent = await fs.promises.readFile(cssPath, { encoding: 'utf8' });
            const filePath = join(process.cwd(), 'src/pdf-html/batch-prep/county-report.html');
            let content = await fs.promises.readFile(filePath, 'utf8');
            let reportData;

            if (batch?.batchIds?.length > 0) {
                reportData = await this.fetchCountyReportDataByBatches(batch?.batchIds);
            }

            const mappings: Record<string, string> = {
                '{{generateTables}}': generateColumn(reportData),
            };

            const replacePlaceholders = (content: string, mappings: Record<string, string>): string => {
                return content.replace(/{{\w+}}/g, (match) => mappings[match] || '');
            };
            content = replacePlaceholders(content, mappings);
            const bodyContent = `<div class="form-content">${content}</div>`;

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Tags & Titles PDF</title>
                        <style>${cssContent}</style>
                    </head>
                    <body>
                        ${bodyContent}
                    </body>
                </html>
            `;

            const file = { content: htmlContent };

            //with timeout
            const pdfGeneration = htmlToPdf.generatePdf(file, { format: 'A4', printBackground: true });
            const timeout = new Promise<Buffer | null>((_, reject) =>
                setTimeout(() => reject(new Error('PDF generation timeout')), timeoutLimit)
            );

            // timeout & PDF generation
            pdfBuffer = await Promise.race([pdfGeneration, timeout]).catch((error) => {
                if (error.message === 'PDF generation timeout') {
                    //status pending if times out
                    status = BatchHistoryPdfStatus.IN_PROGRESS;
                    updateBatchHistory(batchIds, fileName, status);
                    //PDF in background
                    pdfGeneration
                        .then(async (buffer) => {
                            fileName = `report.pdf`;
                            status = BatchHistoryPdfStatus.READY_TO_DOWNLOAD;
                            await this.uploadCountyReport(fileName, buffer, batchIds, status);
                        })
                        .catch((backgroundError) => {
                            status = BatchHistoryPdfStatus.FAILED;
                            updateBatchHistory(batchIds, fileName, status);
                            throwException(backgroundError);
                        });
                    return null;
                }
                throw error;
            });

            if (pdfBuffer) {
                fileName = `report.pdf`;
                status = BatchHistoryPdfStatus.READY_TO_DOWNLOAD;
                await this.uploadCountyReport(fileName, pdfBuffer, batchIds, status);

                if (batchIds.length > 0) {
                    await this.manager
                        .createQueryBuilder()
                        .update(Batches)
                        .set({ completedBy: userId, completedAt: new Date() })
                        .where("id IN (:...batchIds)", { batchIds })
                        .execute();
                }
            }

            return pdfBuffer;
        } catch (error) {
            status = BatchHistoryPdfStatus.FAILED;
            await updateBatchHistory(batchIds, fileName, status);
            throwException(error);
        }
    }
    async getCountyReportData(id) {
        try {
            const rawResult = await this.manager.createQueryBuilder(BatchGroups, "batchGroup")
                .leftJoin("batchGroup.groupBatch", "groupBatch")
                .leftJoin("groupBatch.batchPrepMapping", "batchPrepMapping")
                .leftJoin("batchPrepMapping.ticket", "ticket")
                .leftJoin("ticket.invoiceChecks", "check")
                .leftJoin("ticket.customer", "customer")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.billingInfo", "billingInfo")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .leftJoin("groupBatch.county", "county")
                .select([
                    "groupBatch.id", "groupBatch.countyId", "groupBatch.walkDateProcessing", "groupBatch.dropDateProcessing",
                    "groupBatch.mailDateProcessing", "groupBatch.comment", "county.id", "county.name", "vinInfo.vinNumber",
                    "batchPrepMapping.ticketId", "ticket.invoiceId", "ticket.vinId", "ticket.estimationFees", "billingInfo.runnerNote", "check.checkNum",
                    "customer.name", "basicInfo.transactionTypeId", "transactionType.name", "transactionType.transactionCode",
                ])
                .where("batchGroup.id = :id", { id })
                .getRawMany();

            const groupedResult = rawResult.reduce((acc, item) => {
                const batchId = item.groupBatch_id;

                const groupBatchDates = {
                    walkDate: item?.groupBatch_walk_date_processing,
                    dropDate: item?.groupBatch_drop_date_processing,
                    mailDate: item?.groupBatch_mail_date_processing,
                };
                const selectedDate = Object.values(groupBatchDates).find(date => date !== null);

                if (!acc[batchId]) {
                    acc[batchId] = {
                        batchId: batchId,
                        comment: item?.groupBatch_comment,
                        countyId: item?.groupBatch_county_id,
                        countyName: item?.county_name,
                        processingDate: selectedDate,
                        transactions: {}, // transactions
                    };
                }

                const transactionCode = item?.transactionType_transaction_code;

                // Transaction grouping the batch if it doesn't exist
                if (!acc[batchId].transactions[transactionCode]) {
                    acc[batchId].transactions[transactionCode] = {
                        transactionCode: transactionCode,
                        transactionTypeName: item?.transactionType_name,
                        tickets: [],
                    };
                }

                const ticketId = item?.batchPrepMapping_ticket_id;
                const checkCheckNum = item?.check_check_num;

                //existing ticket with the same ticketId within
                const existingTicket = acc[batchId].transactions[transactionCode].tickets.find(ticket => ticket.ticketId === ticketId);

                if (existingTicket) {
                    //existing checks array
                    existingTicket.checks.push(checkCheckNum);
                } else {

                    acc[batchId].transactions[transactionCode].tickets.push({
                        ticketId: ticketId,
                        invoiceId: item?.ticket_invoice_id,
                        vinId: item?.ticket_vin_id,
                        checks: [checkCheckNum],
                        estimationFees: item.ticket_estimation_fees,
                        customerName: item?.customer_name,
                        transactionTypeId: item?.basicInfo_transaction_type_id,
                        vinNumber: item?.vinInfo_vin_number,
                        runnerNote: item?.billingInfo_runner_note,
                    });
                }

                return acc;
            }, {});

            const groupedArray = Object.values(groupedResult).map((batch: any) => ({
                ...batch,
                transactions: Object.values(batch.transactions),
            }));

            return groupedArray;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchCountyReportDataByBatches(batchIds) {
        try {
            const rawResult = await this.manager.createQueryBuilder(Batches, "groupBatch")
                .leftJoin("groupBatch.batchPrepMapping", "batchPrepMapping")
                .leftJoin("batchPrepMapping.ticket", "ticket")
                .leftJoin("ticket.invoiceChecks", "check")
                .leftJoin("ticket.customer", "customer")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.billingInfo", "billingInfo")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .leftJoin("groupBatch.county", "county")
                .select([
                    "groupBatch.id", "groupBatch.countyId", "groupBatch.walkDateProcessing", "groupBatch.dropDateProcessing",
                    "groupBatch.mailDateProcessing", "groupBatch.comment", "county.id", "county.name", "vinInfo.vinNumber",
                    "batchPrepMapping.ticketId", "ticket.invoiceId", "ticket.vinId", "ticket.estimationFees", "billingInfo.runnerNote", "check.checkNum",
                    "customer.name", "basicInfo.transactionTypeId", "transactionType.name", "transactionType.transactionCode",
                ])
                .where("groupBatch.id IN (:...batchIds)", { batchIds })
                .getRawMany();

            const groupedResult = rawResult.reduce((acc, item) => {
                const batchId = item.groupBatch_id;

                const groupBatchDates = {
                    walkDate: item?.groupBatch_walk_date_processing,
                    dropDate: item?.groupBatch_drop_date_processing,
                    mailDate: item?.groupBatch_mail_date_processing,
                };

                const selectedDate = Object.values(groupBatchDates).find(date => date !== null);    //processing date

                // Batch grouping 
                if (!acc[batchId]) {
                    acc[batchId] = {
                        batchId: batchId,
                        comment: item?.groupBatch_comment,
                        countyId: item?.groupBatch_county_id,
                        countyName: item?.county_name,
                        processingDate: selectedDate,
                        transactions: {}
                    };
                }

                const transactionCode = item?.transactionType_transaction_code;

                // Transaction grouping within the batch if it doesn't exist
                if (!acc[batchId].transactions[transactionCode]) {
                    acc[batchId].transactions[transactionCode] = {
                        transactionCode: transactionCode,
                        transactionTypeName: item?.transactionType_name,
                        tickets: [], // Tickets
                    };
                }

                const ticketId = item?.batchPrepMapping_ticket_id;
                const checkCheckNum = item?.check_check_num;

                //existing ticket with the same ticketId within
                const existingTicket = acc[batchId].transactions[transactionCode].tickets.find(ticket => ticket.ticketId === ticketId);

                if (existingTicket) {
                    existingTicket.checks.push(checkCheckNum);
                } else {

                    acc[batchId].transactions[transactionCode].tickets.push({
                        ticketId: ticketId,
                        invoiceId: item?.ticket_invoice_id,
                        vinId: item?.ticket_vin_id,
                        checks: [checkCheckNum],
                        estimationFees: item.ticket_estimation_fees,
                        customerName: item?.customer_name,
                        transactionTypeId: item?.basicInfo_transaction_type_id,
                        vinNumber: item?.vinInfo_vin_number,
                        runnerNote: item?.billingInfo_runner_note,
                    });
                }

                return acc;
            }, {});

            const groupedArray = Object.values(groupedResult).map((batch: any) => ({
                ...batch,
                transactions: Object.values(batch.transactions),
            }));

            return groupedArray;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchCsvByGroup(batchIds) {
        try {
            const batchGroupData = await this.manager.createQueryBuilder(Batches, "groupBatch")
                .leftJoin("groupBatch.batchPrepMapping", "batchPrepMapping", "batchPrepMapping.batchId IS NOT NULL")
                .leftJoin("groupBatch.county", "county")
                .leftJoin("county.countyProcessing", "countyProcessing")
                .leftJoin("batchPrepMapping.ticket", "ticket")
                .leftJoin("ticket.vinInfo", "vinInfo")
                .leftJoin("ticket.customer", "ticketCustomer")
                .leftJoin("ticket.basicInfo", "basicInfo")
                .leftJoin("ticket.tavtForm", "tavtForm")
                .leftJoin("basicInfo.transactionType", "transactionType")
                .select([
                    "groupBatch.id",
                    "groupBatch.countyId",
                    "county.id",
                    "county.name",
                    "countyProcessing.type",
                    "batchPrepMapping.id",
                    "batchPrepMapping.ticketId",
                    "batchPrepMapping.countyId",
                    "batchPrepMapping.batchId",
                    "ticket.id",
                    "ticket.invoiceId",
                    "ticket.vinId",
                    "ticket.customerId",
                    "vinInfo.vinNumber",
                    "ticketCustomer.name",
                    "basicInfo.transactionTypeId",
                    "transactionType.name",
                    "tavtForm.checkCount"
                ])
                .where("groupBatch.id IN (:...batchIds)", { batchIds })
                .getMany();
            const formattedData = [];
            let lastProcessingType = null;
            batchGroupData?.forEach(item => {
                item.batchPrepMapping.forEach(batchItem => {
                    const baseTaskId = `${batchItem?.ticket?.id}_0`; // Base task_id for reference
                    const batchEntryTemplate = {
                        processing_type: null,
                        batch: batchItem.batchId,
                        county: item?.county?.name,
                        invoice_id: batchItem?.ticket?.invoiceId,
                        task_id: baseTaskId,
                        customer: batchItem?.ticket?.customer?.name,
                        vin: batchItem?.ticket?.vinInfo?.vinNumber,
                        tran_type: batchItem?.ticket?.basicInfo?.transactionType?.name,
                        check: null,
                        amount: null
                    };

                    // Add processing_type only for the first item in each new group
                    if (lastProcessingType !== CountyProcessingTypes[item.county.countyProcessing.type]) {
                        batchEntryTemplate.processing_type = CountyProcessingTypes[item.county.countyProcessing.type] || null;

                        // Update lastProcessingType
                        lastProcessingType = CountyProcessingTypes[item.county.countyProcessing.type];
                    }

                    // Handle multiple checks
                    const checkCount = batchItem?.ticket?.tavtForm?.checkCount || 1;
                    for (let i = 0; i < checkCount; i++) {
                        const batchEntry = { ...batchEntryTemplate }; // Create a copy of the template
                        batchEntry.task_id = `${batchItem?.ticket?.id}_${i}`; // Update task_id based on the index
                        formattedData.push(batchEntry);
                    }
                });
            });

            return formattedData;
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetches a list of completed batches based on the provided filter criteria.
     *
     * @param dto - An object containing the filter criteria for the completed batches.
     * @param dto.countyIds - An array of county IDs to filter by.
     * @param dto.customerIds - An array of customer IDs to filter by.
     * @param dto.transactionTypeIds - An array of transaction type IDs to filter by.
     * @param dto.processingTypes - An array of processing types to filter by.
     * @param dto.processingFromDate - The start date for the processing date filter.
     * @param dto.processingToDate - The end date for the processing date filter.
     * @param dto.search - A search term to filter the batches by.
     * @param dto.limit - The maximum number of batches to return.
     * @param dto.offset - The offset for the pagination.
     * @returns An object containing the list of completed batches and the pagination information.
     */
    async fetchSentToDmvList(dto): Promise<{ completedBatches: BatchPrepMapping[], page: object }> {
        try {
            let integerSearch;
            let listQueryConditions = [];
            let parametersArray = [];

            const listQuery = this.manager.createQueryBuilder(BatchPrepMapping, "batchPrepMapping")
                .innerJoinAndSelect("batchPrepMapping.batch", "batch")
                // .innerJoinAndSelect("batch.group", "group")
                // .innerJoinAndSelect("group.batchHistory", "batchHistory")
                .innerJoinAndSelect("batch.county", "county")
                .leftJoinAndSelect("batch.fedExDocuments", "batchFedExDoc")
                .innerJoinAndSelect("batchPrepMapping.ticket", "ticket")
                .leftJoinAndSelect("ticket.fedExDocuments", "ticketFedExDoc")
                .leftJoinAndSelect("ticket.customer", "customer")
                .leftJoinAndSelect("ticket.ticketStatus", "ticketStatus")
                .leftJoinAndSelect("ticket.vinInfo", "vinInfo")
                .leftJoinAndSelect("ticket.basicInfo", "basicInfo")
                .leftJoinAndSelect("basicInfo.transactionType", "transactionType")
                .leftJoinAndSelect("ticket.invoiceChecks", "invoiceChecks")
                .select([
                    "batch.id", "batch.countyId", "batch.walkDateProcessing", "batch.dropDateProcessing",
                    "batch.mailDateProcessing", "batch.processingType", "batch.dateProcessing",
                    "county.name",
                    "batchPrepMapping.id", "batchPrepMapping.ticketId",
                    "ticket.id", "ticket.invoiceId",
                    "ticketStatus.id", "ticketStatus.internalStatusName",
                    "customer.id", "customer.name",
                    "vinInfo.vinNumber",
                    "basicInfo.transactionTypeId",
                    "transactionType.name",
                    "batchFedExDoc.trackingNumber",
                    "ticketFedExDoc.trackingNumber",
                    "invoiceChecks.checkNum", "invoiceChecks.amount",
                    // "group.id",
                    // "batchHistory.id"
                ])
                .where(`(batch.completedAt IS NOT NULL)`)
                .orderBy("batch.id", "DESC")
                .addOrderBy("ticket.id", "DESC");

            if (dto) {
                //county filter
                if (dto.countyIds?.length) {
                    listQuery.andWhere("county.id IN (:...countyIds)", { countyIds: dto.countyIds });
                }

                //customer filter
                if (dto.customerIds?.length) {
                    listQuery.andWhere("customer.id IN (:...customerIds)", { customerIds: dto.customerIds });
                }

                //transaction type filter
                if (dto.transactionTypeIds?.length) {
                    listQuery.andWhere("transactionType.id IN (:...transactionTypeIds)", { transactionTypeIds: dto.transactionTypeIds });
                }

                //processing type filter
                if (dto.processingTypes?.length) {
                    listQuery.andWhere("batch.processingType IN (:...processingTypes)",
                        { processingTypes: dto.processingTypes });
                }

                //processing date filter
                if (dto.processingFromDate && dto.processingToDate) {

                    if (dto.processingFromDate === dto.processingToDate) {
                        listQuery.andWhere(
                            `(DATE(batch.dateProcessing) = :sameDate)`,
                            { sameDate: dto.processingFromDate }
                        )
                    } else {
                        listQuery.andWhere(`(
                            (DATE(batch.dateProcessing) BETWEEN :fromDate AND :toDate) 
                          OR (DATE(batch.dateProcessing) = :fromDate OR DATE(batch.dateProcessing) = :toDate)
                          )`, { fromDate: dto.processingFromDate, toDate: dto.processingToDate });
                    }
                }

                //search filter
                if (dto.search) {

                    let searchCondition = `(customer.name ILIKE :search)
                    OR (transactionType.name ILIKE :search) 
                    OR (invoiceChecks.checkNum ILIKE :search)
                    OR (transactionType.transactionCode ILIKE :search)
                    OR (batchFedExDoc.trackingNumber ILIKE :search) 
                    OR (ticketFedExDoc.trackingNumber ILIKE :search) 
                    OR (county.name ILIKE  :search)
                    OR (LOWER(vinInfo.vinNumber) ILIKE :search) 
                    OR (LOWER(ticket.invoiceId) ILIKE :search) 
                    OR (ticketStatus.internalStatusName ILIKE :search)`;

                    const params: any = { search: `%${dto.search}%` };

                    //Need to filter out county processing type via search
                    const search = dto.search.toUpperCase(); // Ensure case-insensitivity
                    const processingTypeList = [
                        { name: "WALK", value: CountyProcessingTypes.WALK },
                        { name: "DROP", value: CountyProcessingTypes.DROP },
                        { name: "MAIL", value: CountyProcessingTypes.MAIL },
                    ];
                    const processingTypeMatch = processingTypeList.find(
                        type => type.name.includes(search)
                    );  // Extract the value if a match is found

                    const processingTypeValue = processingTypeMatch ? processingTypeMatch.value : undefined;
                    if (processingTypeValue !== undefined) {
                        searchCondition = searchCondition + ` OR (batch.processingType = :type)`
                        params.type = processingTypeValue;
                    }

                    //if search value is number then filter for ticket's id
                    integerSearch = convertToNumberIfNumeric(dto.search);
                    if (typeof integerSearch === 'number') {
                        searchCondition = `(
                        "batchPrepMapping"."ticket_id"::text ILIKE '%${integerSearch}%'
                        OR "batch"."id"::text ILIKE '%${integerSearch}%'
                        OR "invoiceChecks"."amount"::text ILIKE '%${integerSearch}%'
                        ) 
                        OR ` + searchCondition;

                        params.integerSearch = integerSearch;
                    }

                    listQueryConditions.push(`(${searchCondition})`);
                    parametersArray.push(params);
                }

                listQueryConditions.forEach(condition => {
                    listQuery.andWhere(condition);
                });

                if (parametersArray.length) {
                    listQuery.setParameters(Object.assign({}, ...parametersArray))
                }

                listQuery.take(dto.limit)
                    .skip(dto.offset * dto.limit)
            }

            const completedListWithCount = await listQuery.getManyAndCount();

            if (dto) {
                dto.count = completedListWithCount[1];
            }
            return {
                completedBatches: completedListWithCount[0],
                page: dto
            };

        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetches a list of incomplete batches based on the provided filter criteria.
     *
     * @param dto - An object containing the filter criteria for the incomplete batches.
     * @param dto.countyIds - An array of county IDs to filter by.
     * @param dto.processingTypes - An array of processing types to filter by.
     * @param dto.processingFromDate - The start date for the processing date filter.
     * @param dto.processingToDate - The end date for the processing date filter.
     * @param dto.batchCreatedFromDate - The start date for the batch creation date filter.
     * @param dto.batchCreatedToDate - The end date for the batch creation date filter.
     * @param dto.search - A search term to filter the batches by.
     * @param dto.limit - The maximum number of batches to return.
     * @param dto.offset - The offset for the pagination.
     * @returns An object containing the list of incomplete batches and the pagination information.
     */
    async fetchIncompleteList(dto): Promise<{ incompleteBatches: BatchPrepMapping[], page: object }> {
        try {
            let integerSearch;
            let listQueryConditions = [];
            let parametersArray = [];

            const processingTypeList = [
                { name: "WALK", value: CountyProcessingTypes.WALK },
                { name: "DROP", value: CountyProcessingTypes.DROP },
                { name: "MAIL", value: CountyProcessingTypes.MAIL },
            ];

            let listQuery = this.manager.createQueryBuilder(Batches, "batch")
                .innerJoinAndSelect('batch.batchPrepMapping', 'batchPrepMapping')
                // .leftJoinAndSelect("batch.group", "group")
                .leftJoinAndSelect("batch.createdByUser", "createdByUser")
                .leftJoinAndSelect("batch.county", "county")
                .select([
                    "batch.id AS id", "batch.countyId", "batch.processingType", "batch.dateProcessing",
                    "batch.walkDateProcessing", "batch.dropDateProcessing", "batch.mailDateProcessing", "batch.createdAt",
                    "county.id", "county.name"
                ])
                .where(`(batch.completedAt IS NULL)`)

            if (dto) {
                // county filter
                if (dto.countyIds?.length) {
                    listQuery.andWhere("county.id IN (:...countyIds)", { countyIds: dto.countyIds });
                }

                // processing type filter
                if (dto.processingTypes?.length) {
                    listQuery.andWhere("batch.processingType IN (:...processingTypes)",
                        { processingTypes: dto.processingTypes });
                }

                // processing date filter
                if (dto.processingFromDate && dto.processingToDate) {
                    if (dto.processingFromDate === dto.processingToDate) {
                        listQuery.andWhere(`(DATE(batch.dateProcessing) = :sameDate)`,
                            { sameDate: dto.processingFromDate }
                        );
                    } else {
                        listQuery.andWhere(`(DATE(batch.dateProcessing) BETWEEN :fromDate AND :toDate)`,
                            { fromDate: dto.processingFromDate, toDate: dto.processingToDate }
                        );
                    }
                }

                // batch creation date filter
                if (dto.batchCreatedFromDate && dto.batchCreatedToDate) {
                    if (dto.batchCreatedFromDate === dto.batchCreatedToDate) {
                        listQuery.andWhere(`(DATE(batch.createdAt) = :sameDate)`,
                            { sameDate: dto.batchCreatedFromDate }
                        );
                    } else {
                        listQuery.andWhere(`(DATE(batch.createdAt) BETWEEN :fromDate AND :toDate)`,
                            { fromDate: dto.batchCreatedFromDate, toDate: dto.batchCreatedToDate }
                        );
                    }
                }

                // search
                if (dto.search) {
                    let searchCondition = `(
                        county.name ILIKE :search 
                        OR (CONCAT(createdByUser.firstName, ' ', createdByUser.lastName) ILIKE :search)
                    )`;
                    const params: any = { search: `%${dto.search}%` };


                    //Need to filter out county processing type via search
                    const search = dto.search.toUpperCase();

                    const processingTypeMatch = processingTypeList.find(
                        type => type.name.includes(search)
                    );  // Extract the value if a match is found

                    const processingTypeValue = processingTypeMatch ? processingTypeMatch.value : undefined;
                    if (processingTypeValue !== undefined) {
                        searchCondition = searchCondition + ` OR (batch.processingType = :type)`
                        params.type = processingTypeValue;
                    }

                    //if search value is number then filter for ticket's id
                    integerSearch = convertToNumberIfNumeric(dto.search);
                    if (typeof integerSearch === 'number') {
                        searchCondition = `(
                         "batch"."id"::text ILIKE '%${integerSearch}%'
                        ) OR ` + searchCondition;

                        params.integerSearch = integerSearch;
                    }

                    listQueryConditions.push(`(${searchCondition})`);
                    parametersArray.push(params);

                    listQueryConditions.forEach(condition => {
                        listQuery.andWhere(condition);
                    });

                    if (parametersArray.length) {
                        listQuery.setParameters(Object.assign({}, ...parametersArray))
                    }
                }
            }

            const count = await listQuery.getCount();

            const incompleteBatches = await listQuery.distinctOn(["batch.id"])
                .groupBy("batch.id, batch.countyId, batch.walkDateProcessing, batch.dropDateProcessing, batch.mailDateProcessing, batch.createdAt, county.name, createdByUser.firstName, createdByUser.lastName, county.id")
                .addSelect('CAST(COUNT(batchPrepMapping.ticketId) AS INTEGER)', 'ticket_count')
                .addSelect("CONCAT(createdByUser.firstName, ' ', createdByUser.lastName) AS created_by_user_full_name")
                .limit(dto.limit)
                .offset(dto.offset * dto.limit)
                .orderBy("batch.id", "DESC")
                .getRawMany();

            return {
                incompleteBatches,
                page: { ...dto, count }
            };

        } catch (error) {
            throwException(error);
        }
    }


    async uploadDocuments(batchIds, file, user: User) {
        await this.manager.transaction(async (transactionalEntityManager) => {
            try {
                // Prepare file information
                const fileName = editFileName(file);
                const folderPath = `${batchDocuments}`;
                const filePath = path.join(process.cwd(), folderPath, fileName);

                await pathExistence(filePath);
                fs.writeFileSync(filePath, file.buffer);

                // Parse CSV file and prepare data for bulk insert
                const stream = fs.createReadStream(filePath).pipe(csvParser());
                const bulkPush = [];
                for await (const row of stream) {
                    bulkPush.push({
                        batchId: Number(row?.batch),
                        ticketId: Number(row?.task_id.split("_")[0]),
                        checkNum: row?.check,
                        amount: parseFloat(row?.amount) || 0,
                        order: Number(row?.task_id.split("_")[1]),
                    });
                }

                const ticketVerifying = await this.getTicketsFromGroup(batchIds)
                this.validateBulkIns(ticketVerifying, bulkPush);

                const dataExist = await InvoiceChecks.count({ where: { batchId: In(batchIds) } })
                if (dataExist > 0) {
                    await transactionalEntityManager.createQueryBuilder()
                        .delete()
                        .from(InvoiceChecks)
                        .where("batchId IN (:...batchIds)", { batchIds })
                        .execute();
                }
                // Bulk insert into InvoiceChecks
                await transactionalEntityManager.createQueryBuilder()
                    .insert()
                    .into(InvoiceChecks)
                    .values(bulkPush)
                    .execute();

                fs.unlinkSync(filePath)
            } catch (error) {
                throw new BadRequestException(`${error}&&&attachment&&&ERROR_MESSAGE`);
            }
        });
    }

    validateBulkIns(ticketVerifying, bulkIns) {
        const invalidTickets = bulkIns
            .map(item => item.ticketId)
            .filter(ticketId => !ticketVerifying.includes(ticketId));

        if (invalidTickets.length > 0) {
            throw new Error(`&&&&&&ERR_UPLOAD_CSV`);
        }
    }

    deleteInvoiceChecks(groupId) {
        return this.manager.createQueryBuilder()
            .delete()
            .from(InvoiceChecks)
            .where("groupId = :groupId", { groupId })
            .execute();
    }

    async getBatchHistory(filterDto) {
        try {
            const listQuery = this.manager.createQueryBuilder(BatchHistory, "history")
                .select(["history.generatedDate", "history.id", "history.status", "history.downloadedDate"])

            if (filterDto.status) {
                const statusArray = Array.isArray(filterDto.status) ? filterDto.status : [filterDto.status];
                listQuery.andWhere("history.status IN (:...status)", { status: statusArray });
            }
            if (filterDto.fromDate && filterDto.toDate) {
                listQuery.andWhere("history.generatedDate BETWEEN :fromDate AND :toDate", {
                    fromDate: filterDto.fromDate,
                    toDate: filterDto.toDate,
                });
            }

            listQuery.orderBy(`history.${filterDto.orderBy}`, filterDto.orderDir);

            const list = await listQuery.getMany();
            return { list, page: filterDto }
        } catch (error) {
            throwException(error);
        }
    }

    async countyDetails(dto) {
        try {
            const queryBuilder = await this.manager
                .createQueryBuilder(Batches, "batch")
                .innerJoinAndSelect("batch.county", "county")
                .innerJoinAndSelect("county.countyProcessing", "countyProcessing")
                .select(["batch.id", "batch.processingType", "county.id", "county.name"])
                .where("batch.id IN (:...batchIds)", { batchIds: dto.batchIds });

            return await queryBuilder.getMany();
        } catch (error) {
            throwException(error);
        }
    }

    async generateLabels(token, batches) {
        try {
            const apiUrl = `${this.configService.get("fed_ex.host")}/ship/v1/shipments`;
            const [fedExConfig] = await FedExConfig.find({ select: ["fromShipper"] });

            const results = [];
            for (const batch of batches) {
                const fedExData = batch?.county?.countyProfile?.fedExData;

                if (!fedExData || !fedExData.location || !fedExData.fedexServiceMaster?.serviceCode) {
                    throw new ConflictException(`ERR_FED_EX_ADDRESS_CONFIG&&&batch ID: Batch${batch.id}`);
                }

                const shipmentData = fedExShipmentJson({
                    accountNumber: this.configService.get("fed_ex.account_number"),
                    fromShipper: fedExConfig?.fromShipper,
                    returnRecipient: {
                        contactName: fedExData.contactName,
                        companyName: fedExData.companyName,
                        phone: fedExData.phone,
                        addressLineOne: fedExData.location.addressLineOne,
                        addressLineTwo: fedExData.location.addressLineTwo,
                        city: fedExData.location.city,
                        state: fedExData.location.state,
                        zipCode: fedExData.location.zipCode,
                        country: fedExData.location.country,
                        service: fedExData.fedexServiceMaster.serviceCode
                    }
                }, false);



                const response = await axios.post(apiUrl, shipmentData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const shipment = response.data.output.transactionShipments[0];
                const labelUrl = shipment.pieceResponses[0]?.packageDocuments[0]?.url;

                if (labelUrl) {
                    results.push({
                        batchId: batch.id,
                        serviceType: shipment.serviceType,
                        shipDate: shipment.shipDatestamp,
                        trackingNumber: shipment.masterTrackingNumber,
                        label: await axios.get(labelUrl, { responseType: 'stream' }),
                    });
                } else {
                    results.push({
                        batchId: batch.id,
                        error: "Label URL not found"
                    });
                }
            }

            return results;
        } catch (error: any) {
            if (error.response.data) {
                throw new BadRequestException(`${error?.response?.data?.errors?.map(v => v.message).join(" | ")}&&&&&&ERROR_MESSAGE`)
            }
            throwException(error);
        }
    }

    async batchPrepRound(dto) {
        const { countyIds, cityIds, dateProcessing } = dto;

        try {
            //matching lengths
            if (countyIds.length !== cityIds.length) {
                throw new Error("ERROR_MESSAGE");
            }

            // pairs of cityId and countyId
            const pairs = countyIds.map((countyId, index) => ({
                countyId,
                cityId: cityIds[index],
            }));

            // Processing data for counties
            const counties = await Promise.all(
                pairs.map(async (pair) => {
                    const query = CountyProcessing.createQueryBuilder('county')
                        .select(['county.id', 'county.countyId', 'county.cityId', 'county.type', 'county.worksType',
                            'county.renewalWorks', 'county.titleWorks', 'county.workRounds', 'county.dropWorkRounds'])
                        .where('county.countyId = :countyId', { countyId: pair.countyId });

                    //conditions cityId
                    if (pair.cityId !== null) {
                        query.andWhere('county.cityId = :cityId', { cityId: pair.cityId });
                    } else {
                        query.andWhere('county.cityId IS NULL');
                    }

                    return await query.getRawMany();

                })
            );

            if (dateProcessing) {
                const response = await Promise.all(
                    pairs.map(async (pair) => {
                        const { countyId, cityId } = pair;
                        // Fetch county details
                        const county = counties.flat().find((c) => c.county_county_id === countyId);

                        if (!county) {
                            return {
                                countyId,
                                cityId,
                                walkRoundLimit: 0,
                                dropRoundLimit: 0,
                                completedWalkRoundLimit: 0,
                                completedDropRoundLimit: 0,
                                previouslyCreatedRound: null,
                            };
                        }

                        const { county_work_rounds, county_drop_work_rounds } = county;
                        // Query data for the specific pair
                        const result = await this.batchRepository
                            .createQueryBuilder('batch')
                            .select('batch.countyId', 'countyId')
                            .addSelect('batch.cityId', 'cityId')
                            .addSelect(
                                `SUM(CASE WHEN DATE(batch.walkDateProcessing) = :dateProcessing THEN 1 ELSE 0 END)`,
                                'completedWalkRoundLimit'
                            )
                            .addSelect(
                                `SUM(CASE WHEN DATE(batch.dropDateProcessing) = :dateProcessing THEN 1 ELSE 0 END)`,
                                'completedDropRoundLimit')
                            .where('batch.countyId = :countyId', { countyId })
                            .andWhere(
                                new Brackets((qb) => {
                                    qb.where('batch.cityId = :cityId', { cityId }).orWhere('batch.cityId IS NULL');
                                })
                            )
                            .setParameter('dateProcessing', dateProcessing)
                            .groupBy('batch.countyId, batch.cityId')
                            .getRawOne();

                        const { completedWalkRoundLimit = 0, completedDropRoundLimit = 0 } = result || {};
                        // Fetch related tickets and transaction code
                        let previouslyCreatedRound = null;
                        const filteredCounties = counties.flat().filter((county) => parseInt(county.county_works_type) === WorksType.TITLE_AND_RENEWAL) || [];
                        if (filteredCounties.length > 0) {
                            const latestBatch: any = await this.batchRepository.findOne({
                                where: [
                                    {
                                        countyId,
                                        cityId,
                                        walkDateProcessing: Between(
                                            new Date(`${dateProcessing} 00:00:00`),
                                            new Date(`${dateProcessing} 23:59:59`)
                                        ),
                                    },
                                    {
                                        countyId,
                                        cityId,
                                        dropDateProcessing: Between(
                                            new Date(`${dateProcessing} 00:00:00`),
                                            new Date(`${dateProcessing} 23:59:59`)
                                        ),
                                    },
                                    {
                                        countyId,
                                        cityId,
                                        mailDateProcessing: Between(
                                            new Date(`${dateProcessing} 00:00:00`),
                                            new Date(`${dateProcessing} 23:59:59`)
                                        ),
                                    },
                                ],
                                relations: [
                                    'batchPrepMapping',
                                    'batchPrepMapping.ticket',
                                    'batchPrepMapping.ticket.basicInfo',
                                    'batchPrepMapping.ticket.basicInfo.transactionType',
                                ],
                                order: { createdAt: 'DESC' },
                            });

                            if (latestBatch?.batchPrepMapping.length > 0) {
                                const firstTicket = latestBatch.batchPrepMapping;
                                // transactionCode if exists
                                previouslyCreatedRound = firstTicket[0]?.ticket?.basicInfo?.transactionType?.transactionCode || null;
                            }
                        }

                        return {
                            countyId,
                            cityId,
                            walkRoundLimit: county_work_rounds,
                            dropRoundLimit: county_drop_work_rounds,
                            completedWalkRoundLimit,
                            completedDropRoundLimit,
                            previouslyCreatedRound,
                        };
                    })
                );
                return response;
            }
        } catch (error) {
            throwException(error);
        }
    }

    async uploadCountyReport(name, pdfBuffer, batchIds, status) {
        try {
            const fileNameDate = Date.now();
            const fileName = `${fileNameDate}_${name} `;

            const folderPath = `${batchDocuments}/county-report`;
            const filePath = path.join(process.cwd(), folderPath, fileName);
            await pathExistence(filePath);
            fs.writeFileSync(filePath, pdfBuffer);
            await updateBatchHistory(batchIds, fileName, status);
        }
        catch (error) {
            throwException(error);
        }
    }
    async getFedExFlagByGroup(batchIds) {
        try {
            const batchData = await checkBatchExists(batchIds);
            const mailBatch = batchData.filter(v => v.county.countyProcessing.type == CountyProcessingTypes.MAIL)
            const count = await FedExDocuments.count({ where: { batchId: In(mailBatch.map(v => v.id)) } });
            return { isNotDisable: mailBatch.length === 0 || count > 0 };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketsFromGroup(batchIds) {
        const data = await Batches.createQueryBuilder("groupBatch")
            .leftJoin("groupBatch.batchPrepMapping", "batchPrepMapping")
            .select(["groupBatch.id", "batchPrepMapping.ticketId"])
            .where("groupBatch.id IN (:...batchIds)", { batchIds })
            .getMany();

        const ticketIds = data.flatMap(batch =>
            batch.batchPrepMapping.map(mapping => mapping?.ticketId)
        );

        return ticketIds
    }

    async getTrackingStatus(token, trackingId) {
        try {
            const payload = {
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingId
                        }
                    }
                ],
                includeDetailedScans: true
            }
            const apiUrl = `${this.configService.get("fed_ex.host")}/track/v1/trackingnumbers`;
            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new BadRequestException(`${error?.response?.data?.errors?.map(v => v.message).join(" | ")}&&&&&&ERROR_MESSAGE`)
            }
            throwException(error);
        }
    }


}




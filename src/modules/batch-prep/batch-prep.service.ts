import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BatchPrepRepository } from "./batch-prep.repository";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { throwException } from "src/shared/utility/throw-exception";
import { BatchQueryDto } from "./dto/batch-list.dto";
import { PageQueryDto } from "./dto/list-query.dto";
import { stringify } from 'csv-stringify';
import { BatchDocuments } from "src/shared/entity/batch-documents.entity";
import { batchDocuments, fedExBatchPath } from "src/config/common.config";
import * as fs from 'fs';
import * as path from 'path';
import { BatchHistory } from "src/shared/entity/batch-history.entity";
import { BatchHistoryPdfStatus } from "src/shared/enums/batch-history.enum";
import { checkBatchExists } from "src/shared/utility/common-function.methods";
import { FedExDocuments } from "src/shared/entity/fedex-labels.entity";
import { In } from "typeorm";
import { editFileName, pathExistence } from "src/shared/helper/file-validators";
import { FedExService } from "../master-listing/fedex.service";
import { TicketStatuses } from "src/shared/entity/ticket-statuses.entity";
import { SlugConstants } from "src/shared/constants/common.constant";
import { Tickets } from "src/shared/entity/tickets.entity";
import { GetSentToDmvListDto } from "./dto/get-sent-dmv-list.dto";
import { GetBatchReviewListDto } from "./dto/get-batch-review-list.dto";
import { GetIncompleteListDto } from "./dto/get-incomplete-list.dto";
import { BatchCommentsArrayDto } from "./dto/create-county-report.dto";
import { Batches } from "src/shared/entity/batch.entity";
import { InvoiceChecks } from "src/shared/entity/invoice-checks.entity";


@Injectable()
export class BatchPrepService {
    constructor(
        @InjectRepository(BatchPrepRepository)
        private readonly batchPrepRepository: BatchPrepRepository,
        private readonly fedExService: FedExService,
    ) { }

    async setBatch(batch, userId: number, query): Promise<AppResponse> {
        try {
            await this.batchPrepRepository.setBatch(batch, userId, query);
            return {
                message: "SUC_BATCH_PREP_CREATED"
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getBatchList(query: BatchQueryDto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.getBatchPrep(query);
            return {
                message: "SUC_BATCH_PREP_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTicketListByType(query: PageQueryDto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.fetchTickets(query);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteBatchPrep(deleteBatch): Promise<AppResponse> {
        try {
            return await this.batchPrepRepository.deleteBatchPrep(deleteBatch);
        } catch (error) {
            throwException(error);
        }
    }

    async getBatchPrepCounts(query): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.getBatchPrepCount(query);
            return {
                message: "SUC_BATCH_PREP_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getBatchReviewList(dto: GetBatchReviewListDto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.fetchBatchReviewList(dto);
            return {
                message: "SUC_BATCHES_FETCHED",
                data
            }
        } catch (error) {
            throwException(error);
        }
    }

    async getIncompleteList(dto: GetIncompleteListDto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.fetchIncompleteList(dto);

            return {
                message: "SUC_BATCH_HISTORY_FETCHED",
                data
            }
        } catch (error) {
            throwException(error);
        }
    }

    async getSentToDmvList(dto: GetSentToDmvListDto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.fetchSentToDmvList(dto);

            return {
                message: "SUC_BATCH_HISTORY_FETCHED",
                data
            }
        } catch (error) {
            throwException(error);
        }
    }

    async createBatch(batch, userId: number, query): Promise<AppResponse> {
        try {
            const data: any = await this.batchPrepRepository.createBatch(batch, userId, query);
            return {
                message: "SUC_BATCH_CREATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async countyReport(comments: BatchCommentsArrayDto, userId: number, res: any): Promise<any> {
        try {
            const buffer = await this.batchPrepRepository.generateCountyReport(comments, userId);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=hu.pdf`,
                'Content-Length': buffer.length,
            });

            res.end(buffer);
        } catch (error) {
            throwException(error)
        }
    }

    async prepareCsv(res, batchIds) {
        try {
            const data = await this.batchPrepRepository.fetchCsvByGroup(batchIds)
            const existInvoice = await InvoiceChecks.find({ where: { batchId: In(batchIds) } })
            const updatedData = data.map(item => {
                // Find matching invoice based on task_id
                const matchedInvoice = existInvoice.find(invoice => `${invoice.ticketId}_${invoice.order}` === item.task_id);

                // If found, update check and amount
                if (matchedInvoice) {
                    item.check = matchedInvoice.checkNum;
                    item.amount = matchedInvoice.amount;
                }

                return item;
            });
            const csvBuffer = await this.generateCsvBuffer(updatedData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="batch-checks.csv"');
            return res.send(csvBuffer);

        } catch (err) {
            res.status(500).send("ERR_CSV_GENERATE");
        }
    }

    async generateCsvBuffer(data: any[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            stringify(
                data,
                { header: true, columns: Object.keys(data[0] || {}) },
                (err, output) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Buffer.from(output));
                    }
                }
            );
        });
    }

    async uploadDocuments(batchIds, user, files) {
        try {
            if (files?.length > 1) {
                throw new Error("ERR_MAX_FILES");
            }

            const batchesCount = await Batches.count({ where: { id: In(batchIds) } });
            if (batchesCount !== batchIds.length) {
                throw new NotFoundException("ERR_BATCH_NOT_FOUND&&&batchIds");
            }

            if (files.length > 0) {
                files.forEach(file => {
                    const isCSV = file.originalname.toLowerCase().endsWith('.csv') || file.mimetype === 'text/csv';
                    if (!isCSV) {
                        throw new BadRequestException("ERR_FILE_CSV_UPLOAD");
                    }
                });
                await this.batchPrepRepository.uploadDocuments(batchIds, files[0], user);
            }
            return {
                message: "SUC_DOC_UPLOADED",
                data: {}
            };
        } catch (error) {
            throwException(error)
        }
    }

    async downloadDocument(id, res) {
        const getDocument = await BatchDocuments.findOne({ where: { id } });
        if (!getDocument) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
        }
        const folderPath = `${batchDocuments}/${getDocument.groupId}`;

        const fullPath = path.join(process.cwd(), folderPath, getDocument.fileName);
        if (!fs.existsSync(fullPath)) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id');
        }
        return res.sendFile(fullPath);
    }

    async deleteDocument(docId, userId: number): Promise<AppResponse> {
        try {
            const document = await BatchDocuments.findOne({ where: { id: docId, isDeleted: false } });
            if (!document) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
            }
            document.isDeleted = true;
            document.updatedBy = userId;
            await document.save();
            await this.batchPrepRepository.deleteInvoiceChecks(document.groupId);
            return {
                message: "SUC_DOCUMENT_DELETED",
                data: document
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getBatchHistoryList(query): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.getBatchHistory(query);
            return {
                message: "SUC_BATCH_HISTORY_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async countiesByGroup(dto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.countyDetails(dto);
            return {
                message: "SUC_TICKET_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
    async downloadCountyReport(id, res) {
        try {
            const getReport = await BatchHistory.findOne({ where: { id }, select: ["fileName", "status"] });

            if (!getReport) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
            }
            const folderPath = `${batchDocuments}/county-report`;
            const fullPath = path.join(process.cwd(), folderPath, getReport.fileName);

            if (!fs.existsSync(fullPath) || !getReport.fileName) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id');
            }
            res.sendFile(fullPath, (err) => {
                if (err) {
                    throwException(err);
                } else {
                    BatchHistory.update({ id }, { status: BatchHistoryPdfStatus.DOWNLOADED, downloadedDate: new Date() })
                }
            });
        } catch (error) {
            throwException(error);
        }
    }

    async generateReturnLabel(batchIds, user): Promise<any> {
        try {
            const batches = await checkBatchExists(batchIds);
            const fedExDoc = await FedExDocuments.find({ where: { batchId: In(batchIds), isReturnLabel: true, isDeleted: false } });
            if (fedExDoc.length > 0) {
                await FedExDocuments.update(
                    { id: In(fedExDoc.map(v => v.id)) },
                    { isDeleted: true }
                );
            }
            const getAuthToken = await this.fedExService.getFedExOAuthToken();
            if (!getAuthToken) {
                throw new ConflictException("ERROR_MESSAGE&&&fed-ex-O-auth")
            }
            const pdfResponse = await this.batchPrepRepository.generateLabels(getAuthToken, batches);
            await this.uploadLabels(pdfResponse, user);
            return {
                message: "SUC_GENERATE_RETURN_LABEL"
            };
        } catch (error) {
            throwException(error)
        }
    }


    async uploadLabels(pdfResponseArray, user) {
        try {
            // Prepare all file operations and database inserts
            const insertValues = await Promise.all(
                pdfResponseArray.map(async (pdfResponse) => {
                    const { label: pdf, ...payload } = pdfResponse;
                    const fileName = editFileName({ originalname: "return-label.pdf" });
                    const folderPath = path.join(process.cwd(), fedExBatchPath(pdfResponse.batchId));
                    const filePath = path.join(folderPath, fileName);

                    // Ensure the directory exists
                    await pathExistence(filePath);

                    // Save PDF to file
                    await new Promise((resolve, reject) => {
                        const writeStream = fs.createWriteStream(filePath);
                        pdf.data.pipe(writeStream);

                        pdf.data.on('end', resolve);
                        pdf.data.on('error', reject);
                    });

                    // Prepare data for bulk insert
                    return {
                        ticketId: payload.ticketId, // Ensure this exists in `payload`
                        isReturnLabel: true,
                        fileName,
                        createdBy: user.id,
                        ...payload,
                    };
                })
            );

            // Perform a single bulk insert
            await FedExDocuments.createQueryBuilder()
                .insert()
                .into(FedExDocuments)
                .values(insertValues)
                .execute();

            // Return the file paths for reference
            return insertValues.map(({ fileName }) => fileName);
        } catch (err) {
            throwException(err);
        }
    }

    async batchPrepRound(dto): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.batchPrepRound(dto);
            return {
                message: "SUC_BATCH_PREP_ROUNDS",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getFedExFlagByGroup(batchIds): Promise<AppResponse> {
        try {
            const data = await this.batchPrepRepository.getFedExFlagByGroup(batchIds);
            return {
                message: "SUC_BATCH_GROUP_DETAILS_FETCHED",
                data
            }
        } catch (error) {
            throwException(error);
        }
    }

    async setSentToDmv(batchIds, user): Promise<AppResponse> {
        try {
            const ticketIds = await this.batchPrepRepository.getTicketsFromGroup(batchIds);
            const ticketStatus = await TicketStatuses.findOne({ where: { slug: SlugConstants.ticketStatusSentToDmv }, select: ["id"] })
            await Tickets.update({ id: In(ticketIds) }, {
                sentToDmvAt: new Date(),
                sentToDmvBy: user.id,
                ticketStatusId: ticketStatus.id
            })
            return {
                message: "SUC_TICKET_STATUS_UPDATED",
            }
        } catch (error) {
            throwException(error);
        }
    }

    async getTrackingStatus(trackingId: string): Promise<any> {
        try {
            // Fetch authentication token
            const authToken = await this.fedExService.getFedExOAuthTrackingToken();
            if (!authToken) {
                throw new ConflictException("ERROR_MESSAGE&&&fed-ex-O-auth");
            }

            // Fetch tracking status
            const status = await this.batchPrepRepository.getTrackingStatus(authToken, trackingId);

            // Extract relevant information
            const completeTrackResults = status?.output?.completeTrackResults?.[0];
            const trackResults = completeTrackResults?.trackResults?.[0];
            const scanEvents = trackResults?.scanEvents || [];

            const filterRes: any = {
                message: status?.message,
                transactionId: status?.transactionId,
                trackingNumber: completeTrackResults?.trackingNumber,
                shipperInformation: trackResults?.shipperInformation,
                recipientInformation: trackResults?.recipientInformation,
                latestStatus: trackResults?.latestStatusDetail?.statusByLocale,
            };

            // Group scan events by derived status using a Map
            filterRes.status = this.groupScanEvents(scanEvents);
            filterRes.estimation = trackResults.dateAndTimes.map(event => ({
                type: event.type,
                dateTime: event.dateTime
            }));

            return {
                message: "SUC_TRACKING_STATUS_FETCHED",
                trackingStatus: filterRes,
            };
        } catch (error) {
            throwException(error);
        }
    }

    private groupScanEvents(scanEvents: any[]): any[] {
        const groupedEvents = new Map();

        for (const event of scanEvents) {
            const key = `${event.derivedStatusCode}-${event.derivedStatus}`;
            if (!groupedEvents.has(key)) {
                groupedEvents.set(key, {
                    derivedStatusCode: event.derivedStatusCode,
                    derivedStatus: event.derivedStatus,
                    event: [],
                });
            }
            groupedEvents.get(key).event.push(event);
        }

        // Convert Map values to an array
        return Array.from(groupedEvents.values());
    }

}
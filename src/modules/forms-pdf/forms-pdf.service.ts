import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { FormsPdfRepository } from "./forms-pdf.repository";
import { PageQueryDto } from "./dto/list-query.dto";
import { User } from "src/shared/entity/user.entity";
import { PdfStamp } from "src/shared/entity/pdf-stamp.entity";

@Injectable()
export class FormsPdfService {
    constructor(
        @InjectRepository(FormsPdfRepository)
        private readonly formsPdfRepository: FormsPdfRepository
    ) { }

    async createFormsPdf(formsPdf, res): Promise<void> {
        try {
            const buffer = await this.formsPdfRepository.generatePdf(formsPdf);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${formsPdf.ticketId}.pdf`,
                'Content-Length': buffer.length,
            });

            res.end(buffer);
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(404).send(error.message);
            } else if (error instanceof BadRequestException) {
                res.status(400).send(error.message);
            } else {
                res.status(500).send(`${error}&&&&&&ERROR_MESSAGE`);
            }
        }
    }
    async getFormsList(query: PageQueryDto): Promise<AppResponse> {
        try {
            const { ticketId } = query;
            const ticketData = await this.formsPdfRepository.fetchTransactionForm(ticketId);
            const data = await this.formsPdfRepository.fetchAllForms(query, ticketData);
            return {
                message: "SUC_PDF_FORMS_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    /***********************************  pdf forms stamp api ***********************************************/

    async getStampList(query): Promise<AppResponse> {
        try {
            const data = await this.formsPdfRepository.fetchStampList(query);
            return {
                message: "SUC_PDF_STAMP_LIST_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async addStamp(addStamp, user: User): Promise<AppResponse> {
        try {
            const data = await this.formsPdfRepository.addStamp(addStamp, user);
            return {
                message: "SUC_STAMP_CREATED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteStamps(stamps, userId): Promise<AppResponse> {
        try {
            return await this.formsPdfRepository.deleteStamps(stamps, userId);
        } catch (error) {
            throwException(error);
        }
    }

    async updateStamp(id, data, userId): Promise<AppResponse> {
        try {
            const stamp = await PdfStamp.findOne({
                select: ['id', 'stamp', 'updatedBy'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!stamp) {
                throw new NotFoundException(`ERR_STAMP_NOT_FOUND`);
            }
            stamp.stamp = data.stamp;
            stamp.updatedBy = userId;
            await stamp.save();

            return {
                message: "SUC_STAMP_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

}


import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { VinInfoRepository } from "./vin-info.repository";
import { UpdateVinInfoDto } from "../ticket-management/dto/add-vin-info.dto";
import { FMVValucationMaster } from "src/shared/entity/fmv-valucation-master.entity";
import { ColorMaster } from "src/shared/entity/color-master.entity";
import { FmvMasterDocuments } from "src/shared/entity/fmv-master-documents.entity";
import * as path from 'path';
import * as fs from 'fs';
import { fmvDocumentPath } from "src/config/common.config";
import { SetVinInfoDto } from "../ticket-management/dto/set-vin-info.dto";
import { checkFmvDataExists } from "src/shared/utility/common-function.methods";
import { ActivityLogPayload } from "../activity-logs/activity-log.interface";
import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { SocketGateway } from "../socket/socket.gateway";


@Injectable()
export class VinInfoService {
    constructor(
        @InjectRepository(VinInfoRepository)
        private readonly vinInfoRepository: VinInfoRepository,
        private activityLogService: ActivityLogsService,
        private socketGateway: SocketGateway,
    ) { }

    async editVinInfo(vinInfoDto: UpdateVinInfoDto, id, user, files): Promise<AppResponse> {
        try {
            const { newFmvs, ...vinInfo } = await this.vinInfoRepository.editVinInfo(vinInfoDto, id, user);

            if (files.length > 0) {
                if (newFmvs) {
                    const fmvDoc = newFmvs?.filter(i => i.document)
                    if (fmvDoc && fmvDoc.length != files.length) {
                        throw new ConflictException("ERROR_MESSAGE&&&attachments")
                    }

                    files.forEach((file, index) => {
                        file.fmvId = fmvDoc[index].id;
                    });
                    await this.vinInfoRepository.uploadFmvDocumentsBulk(files, user, id, vinInfoDto.ticketId);
                }
            }
            return {
                message: "SUC_VIN_INFO_SAVED",
                data: vinInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async setVinInfo(vinInfoDto: SetVinInfoDto, vinId, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            const vinInfo = await this.vinInfoRepository.setVinInfo(vinInfoDto, vinId, userId, isSummary);

            return {
                message: "SUC_VIN_INFO_SAVED",
                data: vinInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchFMVMaster(vinNum: string) {
        try {
            const fmvMasters = await FMVValucationMaster.find({ where: { vinFirstHalf: vinNum, isDeleted: false } })
            return {
                message: "SUC_FMV_MASTERS_FETCHED",
                data: fmvMasters
            };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchColors() {
        try {
            const vehicleColors = await ColorMaster.find();
            return {
                message: "SUC_COLOR_MASTERS_FETCHED",
                data: vehicleColors
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteFmv(deleteFMV, userId: number): Promise<AppResponse> {
        try {
            const response = await this.vinInfoRepository.deleteFMVs(deleteFMV, userId);
            let data: ActivityLogPayload = {
                userId: userId,
                actionType: ActivityLogActionType.FORM_DATA_REMOVE,
                ticketId: deleteFMV.ticketId,
                fieldName: "FMV Data",
                newData: null,
                oldData: null,
                formType: DataEntryFormType.VEHICLE_INFO
            }

            this.activityLogService.addActivityLog(data, [], SocketEventEnum.TICKET_DATA_REMOVE);
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    async uploadDocuments(id, user, files) {
        try {
            if (files?.length > 30) {
                throw new Error("ERR_MAX_FILES");
            }

            const fmvMaster = await FMVValucationMaster.findOne({ where: { id } });
            if (!fmvMaster) {
                throw new NotFoundException(`ERR_FMV_MATER_NOT_FOUND&&&id`)
            }

            if (files.length > 0) {
                await this.vinInfoRepository.uploadDocuments(fmvMaster, files, user);
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
        const getDocument = await FmvMasterDocuments.findOne({ where: { id } });
        if (!getDocument) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
        }
        const folderPath = `${fmvDocumentPath}/${getDocument.fmvId}`;

        const fullPath = path.join(process.cwd(), folderPath, getDocument.fileName);
        if (!fs.existsSync(fullPath)) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id');
        }
        return res.sendFile(fullPath);
    }

    async deleteDocument(docId, userId: number): Promise<AppResponse> {
        try {
            const document = await FmvMasterDocuments.findOne({ where: { id: docId, isDeleted: false }, relations: ["fmvMaster"] });
            if (!document) {
                throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
            }
            document.isDeleted = true;
            document.updatedBy = userId;
            await document.save();

            const latestVinInfo = await this.vinInfoRepository.getVinData(document.fmvMaster.vinId, document.fmvMaster.ticketId);
            // Emit data ======>>>> vehicle info 
            this.socketGateway.formDataUpdatedEvent(document.fmvMaster.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, latestVinInfo, DataEntryFormType.VEHICLE_INFO);

            return {
                message: "SUC_DOCUMENT_DELETED",
                data: document
            };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchFmvPdfData(query) {
        try {
            const fmvPdfData = await this.vinInfoRepository.fetchFmvPdfData(query);
            return {
                message: "SUC_FMV_PDF_DATA_FETCHED",
                data: fmvPdfData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchFmvPdfDataById(id) {
        try {
            const fmvPdfData = await checkFmvDataExists(id);
            const fmvData = {
                id: fmvPdfData.id,
                vin: fmvPdfData.vin,
                year: fmvPdfData.year,
                series: fmvPdfData.series,
                price: fmvPdfData.price
            }
            return {
                message: "SUC_FMV_PDF_DATA_FETCHED",
                data: fmvData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editPdfData(addFmvPdfData, id, user) {
        try {
            const fmvPdfData = await checkFmvDataExists(id);
            fmvPdfData.vin = addFmvPdfData.vinNumber;
            fmvPdfData.price = addFmvPdfData.price;
            fmvPdfData.series = addFmvPdfData.series;
            fmvPdfData.year = addFmvPdfData.year;
            fmvPdfData.updatedBy = user.id;

            await fmvPdfData.save();
            return {
                message: "SUC_FMV_PDF_DATA_UPDATE",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editData(updateFmvData, id, user) {
        try {
            await this.vinInfoRepository.editFmv(updateFmvData, id, user)
            return {
                message: "SUC_FMV_MASTERS_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getVinHistory(vinNum: string, query) {
        try {
            const data = await this.vinInfoRepository.fetchVinHistory(vinNum, query);
            return {
                message: "SUC_VIN_HISTORY_FETCHED",
                data
            };
        } catch (error) {
            throwException(error);
        }
    }
}

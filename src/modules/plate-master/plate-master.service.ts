import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "src/shared/utility/throw-exception";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { PlateMasterRepository } from "./plate-master.repository";
import { AddPlateMasterDto, UpdatePlateMasterDto } from "./dto/add-plate-master.dto";
import { imageValidation } from "src/shared/helper/file-validators";
import { plateDocumentPath } from "src/config/common.config";
import * as fs from "fs";
import * as path from "path";
import { RedisKey } from "src/shared/enums/cache-key.enum";
import { RedisCacheService } from "examples/redis-cache/redis-cache.service";
import { ListPlatesDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class PlateMasterService {
    constructor(
        @InjectRepository(PlateMasterRepository)
        private readonly plateMasterRepository: PlateMasterRepository,
        private readonly cacheService: RedisCacheService
    ) { }

    async addPlateMaster(dddPlateMasterDto: AddPlateMasterDto, user, file): Promise<AppResponse> {
        try {
            imageValidation(file)
            const plateMaster = await this.plateMasterRepository.addPlateMaster(dddPlateMasterDto, user)
            const data = await this.plateMasterRepository.fetchAllPlates();

            await this.cacheService.deleteCache(RedisKey.PLATE_MASTER);
            await this.cacheService.addCache({ key: RedisKey.PLATE_MASTER, value: data });
            if (file?.length > 0) {
                const [uploadFile] = file;
                await this.plateMasterRepository.uploadDocs(plateMaster, uploadFile, user);
            }
            return {
                message: "SUC_PLATE_MASTER_CREATED",
                data: plateMaster
            };

        } catch (error) {
            throwException(error);
        }
    }

    async editPlateMaster(id, updatePlateMaster: UpdatePlateMasterDto, user, file): Promise<AppResponse> {
        try {
            imageValidation(file)
            const data = await this.plateMasterRepository.editPlateMaster(id, updatePlateMaster, user);
            const plateData = await this.plateMasterRepository.fetchAllPlates();

            await this.cacheService.deleteCache(RedisKey.PLATE_MASTER);
            await this.cacheService.addCache({ key: RedisKey.PLATE_MASTER, value: plateData });
            if (file?.length > 0) {
                const [uploadFile] = file;
                await this.plateMasterRepository.uploadDocs(data, uploadFile, user);
            }
            return {
                message: "SUC_PLATE_MASTER_UPDATED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllPlates(query: ListPlatesDto): Promise<AppResponse> {
        try {
            const { plates, page } = await this.plateMasterRepository.fetchAllPlates(query);
            await this.cacheService.addCache({ key: RedisKey.PLATE_MASTER, value: plates });
            return {
                message: "SUC_PLATE_LIST_FETCHED",
                data: { plates, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getPlateDetails(id): Promise<AppResponse> {
        try {
            const plateDetails = await this.plateMasterRepository.getPlateDetails(id)
            return {
                message: "SUC_PLATE_DETAILS_FETCHED",
                data: plateDetails
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactivePlate(id, user): Promise<AppResponse> {
        try {
            const plate = await this.plateMasterRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!plate) {
                throw new NotFoundException(`ERR_PLATE_MASTER_NOT_FOUND`);
            }

            plate.isActive = !plate.isActive;
            plate.updatedBy = user.id;
            await plate.save();

            return {
                message: plate.isActive
                    ? "SUC_PLATE_ACTIVATED_UPDATED"
                    : "SUC_PLATE_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async downloadDocument(id, res) {
        const getDocument = await this.plateMasterRepository.findOne({ where: { id }, select: ["document"] });
        if (!getDocument) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id')
        }
        const folderPath = `${plateDocumentPath}/${id}`;

        const fullPath = path.join(process.cwd(), folderPath, getDocument.document);
        if (!fs.existsSync(fullPath)) {
            throw new NotFoundException('ERR_DOCUMENT_NOT_FOUND&&&id');
        }
        return res.sendFile(fullPath);
    }
}

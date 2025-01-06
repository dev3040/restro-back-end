import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LienMasterRepository } from "./lien-master.repository";
import { AddLienMasterDto, UpdateLienMasterDto } from "./dto/add-lien-master.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { ListMasterLiensDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class LienMasterService {
    constructor(
        @InjectRepository(LienMasterRepository)
        private readonly lienMasterRepository: LienMasterRepository
    ) { }

    async addLienMaster(addLienMaster: AddLienMasterDto, user: User): Promise<AppResponse> {
        try {
            const createLienMaster = await this.lienMasterRepository.addLienMaster(addLienMaster, user);
            return {
                message: "SUC_LIEN_MASTER_CREATED",
                data: createLienMaster
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getLienMasterList(query: ListMasterLiensDto): Promise<AppResponse> {
        try {
            const { lienMasters, page } = await this.lienMasterRepository.fetchAllLienMaster(query);
            return {
                message: "SUC_LIEN_MASTER_LIST_FETCHED",
                data: { lienMasters, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getLienMaster(id): Promise<AppResponse> {
        try {
            const getLienMaster = await this.lienMasterRepository.findOne({
                where: { id, isDeleted: false },
                select: ["id", "lienHolderId", "mailingAddress", "holderName", "address", "isElt", "isActive", "isDeleted", "createdAt"]
            });
            if (!getLienMaster) {
                throw new NotFoundException(`ERR_LIEN_MASTER_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_LIEN_MASTER_FETCHED",
                data: getLienMaster
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editLienMaster(updateLienMaster: UpdateLienMasterDto, id, user: User): Promise<AppResponse> {
        try {
            await this.lienMasterRepository.editLienMaster(updateLienMaster, id, user);
            return {
                message: "SUC_LIEN_MASTER_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteLienMasters(deleteLienMaster, userId): Promise<AppResponse> {
        try {
            const response = await this.lienMasterRepository.deleteLienMaster(deleteLienMaster, userId);
            return response;

        } catch (error) {
            throwException(error);
        }
    }


    async activeInactiveLien(id, user): Promise<AppResponse> {
        try {
            const getLien = await this.lienMasterRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getLien) {
                throw new NotFoundException(`ERR_LIEN_MASTER_NOT_FOUND&&&id`);
            }

            getLien.isActive = !getLien.isActive;
            getLien.updatedBy = user.id;
            await getLien.save();

            return {
                message: getLien.isActive
                    ? "SUC_LIEN_ACTIVATED_UPDATED"
                    : "SUC_LIEN_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

}

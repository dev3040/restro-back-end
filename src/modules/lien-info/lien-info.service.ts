import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { LienInfoRepository } from "./lien-info.repository";
import { LienInfoDto, LienInfoIdDto } from "./dto/add-lien-info.dto";
import { User } from "src/shared/entity/user.entity";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { SocketGateway } from "../socket/socket.gateway";

@Injectable()
export class LienInfoService {
    constructor(
        @InjectRepository(LienInfoRepository)
        private readonly lienInfoRepository: LienInfoRepository,
        private socketGateway: SocketGateway,
    ) { }

    async saveLienInfo(lienInfoDto: LienInfoDto, user: User): Promise<AppResponse> {
        try {
            const titleInfo = await this.lienInfoRepository.saveLienInfo(lienInfoDto, user);
            return {
                message: "SUC_LIEN_INFO_SAVED",
                data: titleInfo
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteLienInfo(id, user: User): Promise<AppResponse> {
        try {
            const getLienInfo = await this.lienInfoRepository.findOne({
                where: { id: id },
                select: ["id", "ticketId"]
            });
            if (!getLienInfo) {
                throw new NotFoundException(`ERR_LIEN_INFO_NOT_FOUND&&&id`);
            }

            getLienInfo.isDeleted = true;
            getLienInfo.updatedBy = user.id;
            await getLienInfo.save();
            const lienInfo: any = await this.lienInfoRepository.getLienInfoTicket(getLienInfo.ticketId);

            // Emit data : Trade in info
            this.socketGateway.formDataUpdatedEvent(getLienInfo.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, lienInfo, DataEntryFormType.LIEN_INFO);
            return {
                message: "SUC_LIEN_INFO_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getLienInfo(ticketId): Promise<AppResponse> {
        try {
            const getLienInfo = await this.lienInfoRepository
                .createQueryBuilder('lienInfo')
                .leftJoinAndSelect('lienInfo.lien', 'lien')
                .select([
                    "lienInfo.id", "lienInfo.ticketId", "lienInfo.lienId", "lienInfo.idOption", "lienInfo.licenseNumber",
                    "lienInfo.firstName", "lienInfo.middleName", "lienInfo.lastName", "lienInfo.suffix", "lienInfo.isElt",
                    "lienInfo.isIndividual", "lienInfo.address", "lienInfo.isLienChecked",
                    "lien.id", "lien.address", "lien.holderName", "lien.lienHolderId", "lien.isActive", "lien.isDeleted"
                ])
                .where('(lienInfo.ticketId = :ticketId AND lienInfo.isDeleted=false)', { ticketId: ticketId })
                .orderBy('lienInfo.id', 'ASC')
                .getMany();

            return {
                message: "SUC_LIEN_INFO_FETCHED",
                data: getLienInfo
            };
        } catch (error) {
            throwException(error);
        }
    }
    async isLienChecked(id): Promise<AppResponse> {
        try {
            // Check lien checked exists with given ID
            const lienChecked = await this.lienInfoRepository.findOne({
                select: ['id', 'isLienChecked'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!lienChecked) {
                throw new NotFoundException(`ERR_LIEN_INFO_NOT_FOUND`);
            }

            lienChecked.isLienChecked = !lienChecked.isLienChecked;
            await lienChecked.save();

            return {
                message: "SUC_LIEN_INFO_SAVED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveLienData(id: LienInfoIdDto, lienInInfo: LienInfoDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            await this.lienInfoRepository.saveLienData(lienInInfo, id, userId, isSummary);
            return {
                message: "SUC_LIEN_INFO_SAVED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

}

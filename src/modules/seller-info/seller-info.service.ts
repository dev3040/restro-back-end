import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "src/shared/utility/throw-exception";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { checkSellerInfoExists } from "src/shared/utility/common-function.methods";
import { SellerInfoRepository } from "./seller-info.repository";
import { AddSellerInfoDto, UpdateSellerInfoDto } from "./dto/add-seller-info.dto";
import { SocketGateway } from "../socket/socket.gateway";
import { SocketEventEnum } from "src/shared/enums/socket-event.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";

@Injectable()
export class SellerInfoService {
    constructor(
        @InjectRepository(SellerInfoRepository)
        private readonly sellerInfoRepository: SellerInfoRepository,
        private socketGateway: SocketGateway,
    ) { }

    async addSellerInInfo(addSellerDto: AddSellerInfoDto, user): Promise<AppResponse> {
        try {
            const sellerInfo = await this.sellerInfoRepository.addSellerInfo(addSellerDto, user)
            return {
                message: "SUC_SELLER_INFO_CREATED",
                data: sellerInfo
            };

        } catch (error) {
            throwException(error);
        }
    }

    async deleteSellerInfo(id: string, user): Promise<AppResponse> {
        const getData = await checkSellerInfoExists(id)
        getData.isDeleted = true;
        getData.updatedBy = user.id;
        await getData.save();

        this.socketGateway.formDataUpdatedEvent(getData.ticketId, SocketEventEnum.FORM_DETAILS_UPDATE, { sellerInfo: [], formType: DataEntryFormType.SELLER_INFO }, DataEntryFormType.SELLER_INFO);
        return {
            message: "SUC_SELLER_INFO_DELETED",
            data: []
        };
    }
    async editSellerInfo(id, updateTidType: UpdateSellerInfoDto, user): Promise<AppResponse> {
        try {
            const data = await this.sellerInfoRepository.editSellerInfo(updateTidType, id, user);
            return {
                message: "SUC_SELLER_INFO_UPDATED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }
    async getSellerInfo(id): Promise<AppResponse> {
        try {

            const sellerData = await this.sellerInfoRepository.fetchSellerInfo(id);
            if (!sellerData) {
                throw new NotFoundException(`ERR_SELLER_INFO_NOT_FOUND`);
            }

            return {
                message: "SUC_SELLER_INFO_FETCHED",
                data: sellerData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveSellerInInfo(seller, userId, isSummary): Promise<AppResponse> {
        try {
            const data = await this.sellerInfoRepository.saveSellerInfo(seller, userId, isSummary)
            return {
                message: "SUC_SELLER_INFO_CREATED",
                data
            };

        } catch (error) {
            throwException(error);
        }
    }

}

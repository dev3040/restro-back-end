import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { throwException } from "src/shared/utility/throw-exception";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { BuyerInfoRepository } from "./buyer-info.repository";
import { AddBuyerInfoDto, UpdateBuyerInfoDto } from "./dto/add-buyer-info.dto";

@Injectable()
export class BuyerInfoService {
    constructor(
        @InjectRepository(BuyerInfoRepository)
        private readonly buyerInfoRepository: BuyerInfoRepository,
    ) { }

    async addBuyerInInfo(addBuyerDto: AddBuyerInfoDto, user): Promise<AppResponse> {
        try {
            const buyerInfo = await this.buyerInfoRepository.addBuyerInfo(addBuyerDto, user)
            return {
                message: "SUC_BUYER_INFO_CREATED",
                data: buyerInfo
            };

        } catch (error) {
            throwException(error);
        }
    }

    async deleteBuyerInfo(buyerDto): Promise<AppResponse> {
        return this.buyerInfoRepository.deleteBuyer(buyerDto);
    }

    async editBuyerInfo(id, updateBuyerInfo: UpdateBuyerInfoDto, user): Promise<AppResponse> {
        try {
            const data = await this.buyerInfoRepository.editBuyerInfo(updateBuyerInfo, id, user);
            return {
                message: "SUC_BUYER_INFO_UPDATED",
                data: data
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getBuyerInfo(id): Promise<AppResponse> {
        try {
            const getBuyerData = await this.buyerInfoRepository.getBuyerInfo(id);
            if (!getBuyerData) {
                throw new NotFoundException(`ERR_BUYER_INFO_NOT_FOUND`);
            }
            return {
                message: "SUC_BUYER_INFO_FETCHED",
                data: getBuyerData
            };
        } catch (error) {
            throwException(error);
        }
    }

    async saveBuyerInfo(addBuyerDto: AddBuyerInfoDto, userId: number, isSummary: boolean): Promise<AppResponse> {
        try {
            await this.buyerInfoRepository.saveBuyerInfo(addBuyerDto, userId, isSummary)
            return {
                message: "SUC_BUYER_INFO_CREATED"
            };

        } catch (error) {
            throwException(error);
        }
    }
    async deletePurchaseTypeData(id): Promise<AppResponse> {
        await this.buyerInfoRepository.deletePurchaseTypeData(id)

        return {
            message: "SUC_BUYER_INFO_DELETED"
        };
    }

}

import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AddOnPricesRepository } from "./branch-master.repository";
import { BranchesDTO, UpdateBranchesDTO } from "./dto/branch-master.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { ListAddOnPricesDto } from "src/shared/dtos/list-data.dto";
@Injectable()
export class AddOnPricesService {
    constructor(
        @InjectRepository(AddOnPricesRepository)
        private readonly addOnPricesRepository: AddOnPricesRepository,
    ) { }

    async addAddOnPrices(addAddOnPrices: BranchesDTO, user: User): Promise<AppResponse> {
        try {
            const createAdd_on_prices = await this.addOnPricesRepository.addAddOnPrices(addAddOnPrices, user);
            return {
                message: "SUC_ADD_ON_PRICE_CREATED",
                data: createAdd_on_prices
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAddOnPricesList(query: ListAddOnPricesDto): Promise<AppResponse> {
        try {
            const { branches, page } = await this.addOnPricesRepository.fetchAllAddOnPrices(query);
            return {
                message: "SUC_ADD_ON_PRICE_FETCHED",
                data: { branches, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getAddOnPrices(id): Promise<AppResponse> {
        try {
            // Check add_on_prices exists with given ID
            const getPrice = await this.addOnPricesRepository.findOne({
                where: { id: id }
            });
            if (!getPrice) {
                throw new NotFoundException(`ERR_ADD_ON_PRICE_NOT_FOUND&&&id`);
            }
            return {
                message: "SUC_ADD_ON_PRICE_DETAILS_FETCHED",
                data: getPrice
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editAddOnPrices(updateDto: UpdateBranchesDTO, id): Promise<AppResponse> {
        try {
            await this.addOnPricesRepository.editAddOnPrices(updateDto, id);
            return {
                message: "SUC_ADD_ON_PRICE_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async activeInactiveAddOnPrice(id, user): Promise<AppResponse> {
        try {
            // Check Add on price exists with given ID
            const getAddOnPrice = await this.addOnPricesRepository.findOne({
                select: ['id', 'isActive'],
                where: {
                    id: id,
                    isDeleted: false
                }
            });
            if (!getAddOnPrice) {
                throw new NotFoundException(`ERR_TICKET_STATUS_NOT_FOUND`);
            }

            getAddOnPrice.isActive = !getAddOnPrice.isActive;
            await getAddOnPrice.save();

            return {
                message: getAddOnPrice.isActive
                    ? "SUC_ADD_ON_PRICE_ACTIVATED_UPDATED"
                    : "SUC_ADD_ON_PRICE_DEACTIVATED_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteAddOnTransactions(deleteAddOnTransactions, userId): Promise<AppResponse> {
        try {
            const response = await this.addOnPricesRepository.deleteAddOnTransactions(deleteAddOnTransactions, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

import { DealerMaster } from '../../shared/entity/dealer-master.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AddDealerMasterDto, UpdateDealerMasterDto } from "./dto/dealer-master.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { User } from 'src/shared/entity/user.entity';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { checkValidSeller, commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class DealerMasterRepository extends Repository<DealerMaster> {
    constructor(readonly dataSource: DataSource) {
        super(DealerMaster, dataSource.createEntityManager());
    }

    async addDealerMaster(addDealerMaster: AddDealerMasterDto, user: User): Promise<any> {
        try {
            await checkValidSeller(DealerMaster, this.dataSource, addDealerMaster?.name, addDealerMaster?.address);
            const dealerMaster = DealerMaster.create({
                ...addDealerMaster,
                createdBy: user.id,
            });

            const savedDealer = await dealerMaster.save();
            const { name, sellerId, address, salesTaxId, isDealer, sellerType, isActive, id } = savedDealer;
            return { name, sellerId, address, salesTaxId, isDealer, sellerType, isActive, id };

        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllDealerMaster(filterDto?: any): Promise<{ dealerMasters: DealerMaster[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(DealerMaster, "dealerMaster")
                .where("dealerMaster.isDeleted = false")

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit)
                    .limit(filterDto.limit)
                    .orderBy(`dealerMaster.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST');
            }

            if (filterDto?.search) {
                listQuery.andWhere(
                    "(dealerMaster.name ILIKE :search OR CAST(dealerMaster.seller_id AS TEXT) ILIKE :search OR CAST(dealerMaster.id AS TEXT) ILIKE :search)",
                    { search: `%${filterDto.search}%` }
                );
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("dealerMaster.isActive = true")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("dealerMaster.isActive = false")
            }

            if (filterDto?.isDealer) {
                listQuery.andWhere("dealerMaster.isDealer = :isDealer", { isDealer: filterDto.isDealer });
            }

            const dealerMastersWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = dealerMastersWithCount[1];
            }

            return { dealerMasters: dealerMastersWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editDealerMaster(updateDealerMaster: UpdateDealerMasterDto, id, user: User): Promise<DealerMaster> {
        try {
            const dealerMaster = await this.findOne({ where: { id } });
            if (!dealerMaster) {
                throw new NotFoundException("ERR_DEALER_DETAILS_NOT_FOUND");
            }
            await checkValidSeller(DealerMaster, this.dataSource, updateDealerMaster?.name, updateDealerMaster?.address, id);

            Object.assign(dealerMaster, {
                ...updateDealerMaster,
                updatedBy: user.id,
            });

            return dealerMaster.save();
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDealerMaster(deleteDealerMaster, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                DealerMaster,
                deleteDealerMaster,
                userId,
                success.SUC_DEALER_DELETED,
                error.ERR_DEALER_DETAILS_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

import { Branches } from 'src/shared/entity/branches.entity';
import { DataSource, Repository } from 'typeorm';
import {
    ConflictException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { BranchesDTO, UpdateBranchesDTO } from './dto/branch-master.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { IsActive } from 'src/shared/enums/is-active.enum';
import { User } from 'src/shared/entity/user.entity';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';


@Injectable()
export class AddOnPricesRepository extends Repository<Branches> {
    constructor(readonly dataSource: DataSource) {
        super(Branches, dataSource.createEntityManager());
    }

    async addAddOnPrices(addAddOnPrices: BranchesDTO, user: User): Promise<Branches> {
        try {
            const addOnPrice = await this.manager.createQueryBuilder(Branches, "addOnPrice")
                .select(["addOnPrice.id", "addOnPrice.name"])
                .where(`(LOWER(addOnPrice.name) = :name)`, {
                    name: `${addAddOnPrices.name.toLowerCase()}`
                })
                .andWhere(`(addOnPrice.isDeleted = false)`)
                .getOne();
            if (addOnPrice) {
                throw new ConflictException("ERR_ADD_ON_PRICE_NAME_EXIST&&&name");
            }
            const branches = new Branches();
            branches.name = addAddOnPrices.name;
            branches.address = addAddOnPrices.address;
            branches.prnNum = addAddOnPrices.prnNum;
            branches.isActive = addAddOnPrices.isActive;
            branches.code = addAddOnPrices.code;
            branches.createdBy = user.id;
            await branches.save();
            return branches;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllAddOnPrices(filterDto?: any): Promise<{ branches: Branches[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(Branches, "addOnPrice")
                .select(["addOnPrice.id", "addOnPrice.name", "addOnPrice.code", "addOnPrice.isActive", "addOnPrice.address", "addOnPrice.prnNum"])
                .where("(addOnPrice.is_deleted = false)")

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit);
                listQuery.limit(filterDto.limit);
                listQuery.orderBy(`addOnPrice.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST');
            }

            if (filterDto?.search) {
                listQuery.andWhere("(addOnPrice.name ilike :search)", { search: `%${filterDto.search}%` });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(addOnPrice.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(addOnPrice.isActive = false)")
            }

            const addOnPriceWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = addOnPriceWithCount[1];
            }

            return { branches: addOnPriceWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editAddOnPrices(updateAddOnPrices: UpdateBranchesDTO, id): Promise<Branches> {
        try {
            const checkAddOnPrice = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!checkAddOnPrice) throw new NotFoundException(`ERR_ADD_ON_PRICE_NOT_FOUND&&&id`);

            if (updateAddOnPrices?.name) {
                const addOnPrice = await this.manager.createQueryBuilder(Branches, "addOnPrice")
                    .select(["addOnPrice.id", "addOnPrice.name"])
                    .where(`(LOWER(addOnPrice.name) = :name)`, {
                        name: `${updateAddOnPrices.name.toLowerCase()}`
                    })
                    .andWhere(`(addOnPrice.isDeleted = false)`)
                    .andWhere(`(addOnPrice.id != :id)`, { id })
                    .getOne();

                if (addOnPrice) {
                    throw new ConflictException("ERR_ADD_ON_PRICE_NAME_EXIST&&&name");
                }

                checkAddOnPrice.name = updateAddOnPrices?.name;
            }

            checkAddOnPrice.isActive = updateAddOnPrices.isActive;
            checkAddOnPrice.code = updateAddOnPrices.code
            checkAddOnPrice.address = updateAddOnPrices.address;
            checkAddOnPrice.prnNum = updateAddOnPrices.prnNum;
            await checkAddOnPrice.save();
            return checkAddOnPrice;
        } catch (error) {
            throwException(error);
        }
    }

    async deleteAddOnTransactions(deleteAddOnTransactions, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                Branches,
                deleteAddOnTransactions,
                userId,
                success.SUC_ADD_ON_PRICE_DELETED,
                error.ERR_ADD_ON_PRICE_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

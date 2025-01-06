import { AddOnPrices } from 'src/shared/entity/add-on-prices.entity';
import { DataSource, Repository } from 'typeorm';
import {
    ConflictException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { AddAddOnPricesDto, UpdateAddOnPricesDto } from './dto/add-add-on-prices.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { IsActive } from 'src/shared/enums/is-active.enum';
import { User } from 'src/shared/entity/user.entity';
import { commonDeleteHandler, formatPrice } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';


@Injectable()
export class AddOnPricesRepository extends Repository<AddOnPrices> {
    constructor(readonly dataSource: DataSource) {
        super(AddOnPrices, dataSource.createEntityManager());
    }

    async addAddOnPrices(addAddOnPrices: AddAddOnPricesDto, user: User): Promise<AddOnPrices> {
        try {
            const addOnPrice = await this.manager.createQueryBuilder(AddOnPrices, "addOnPrice")
                .select(["addOnPrice.id", "addOnPrice.name"])
                .where(`(LOWER(addOnPrice.name) = :name)`, {
                    name: `${addAddOnPrices.name.toLowerCase()}`
                })
                .andWhere(`(addOnPrice.isDeleted = false)`)
                .getOne();
            if (addOnPrice) {
                throw new ConflictException("ERR_ADD_ON_PRICE_NAME_EXIST&&&name");
            }
            const addOnPrices = new AddOnPrices();
            addOnPrices.name = addAddOnPrices.name;
            addOnPrices.price = formatPrice(addAddOnPrices.price);
            addOnPrices.isActive = addAddOnPrices.isActive;
            addOnPrices.code = addAddOnPrices.code;
            addOnPrices.createdBy = user.id;
            await addOnPrices.save();
            return addOnPrices;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllAddOnPrices(filterDto?: any): Promise<{ addOnPrices: AddOnPrices[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(AddOnPrices, "addOnPrice")
                .select(["addOnPrice.id", "addOnPrice.name", "addOnPrice.price", "addOnPrice.code", "addOnPrice.isActive"])
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

            return { addOnPrices: addOnPriceWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editAddOnPrices(updateAddOnPrices: UpdateAddOnPricesDto, id): Promise<AddOnPrices> {
        try {
            const checkAddOnPrice = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!checkAddOnPrice) throw new NotFoundException(`ERR_ADD_ON_PRICE_NOT_FOUND&&&id`);

            if (updateAddOnPrices?.name) {
                const addOnPrice = await this.manager.createQueryBuilder(AddOnPrices, "addOnPrice")
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

            checkAddOnPrice.price = formatPrice(updateAddOnPrices.price)
            checkAddOnPrice.isActive = updateAddOnPrices.isActive;
            checkAddOnPrice.code = updateAddOnPrices.code
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
                AddOnPrices,
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

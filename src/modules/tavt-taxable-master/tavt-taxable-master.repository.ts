import { DataSource, Not, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TavtTaxableMaster } from 'src/shared/entity/tavt-taxable-master.entity';
import { throwException } from 'src/shared/utility/throw-exception';
import { SaveTaxAbleMasterDto } from './dto/add-taxable-master.dto';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class TavtTaxAbleMasterRepository extends Repository<TavtTaxableMaster> {
    constructor(readonly dataSource: DataSource,) {
        super(TavtTaxableMaster, dataSource.createEntityManager());
    }


    async saveTaxAbleMaster(item: SaveTaxAbleMasterDto, id, user): Promise<{ message: string, data: any }> {
        try {
            let message;
            let data;

            if (parseInt(id)) {
                // Update existing record
                const taxAbleMaster = await TavtTaxableMaster.findOne({ where: { id } });
                if (!taxAbleMaster) throw new NotFoundException(`ERR_TAX_ABLE_MASTER_FOUND&&&id`);

                // Check for duplicate name
                const duplicateName = await TavtTaxableMaster.findOne({
                    where: { name: item.name, id: Not(id) }
                });

                if (duplicateName) throw new ConflictException(`ERR_TAX_ABLE_EXIST`);

                taxAbleMaster.price = item.price;
                taxAbleMaster.isTaxable = item.isTaxable;
                taxAbleMaster.name = item.name;
                taxAbleMaster.isActive = item.isActive;

                data = await taxAbleMaster.save();
                message = "SUC_TAX_ABLE_MASTER_UPDATED";
            } else {
                // Check for duplicate name
                const duplicateName = await TavtTaxableMaster.findOne({ where: { name: item.name } });
                if (duplicateName) throw new ConflictException(`ERR_TAX_ABLE_EXIST`);

                // Create new record
                const taxAbleMaster = TavtTaxableMaster.create({ ...item, createdBy: user.id });
                data = await taxAbleMaster.save();
                message = "SUC_TAX_ABLE_MASTER_ADDED";
            }

            return {
                message,
                data: {
                    name: data.name,
                    price: data.price,
                    id: data.id,
                    isTaxable: data.isTaxable,
                    isActive: data.isActive
                }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getTaxAbleMaster(id) {
        try {
            const listQuery = this.manager.createQueryBuilder(TavtTaxableMaster, "taxAbleMaster")
                .where("taxAbleMaster.id = :id", { id: +id })
                .andWhere("taxAbleMaster.isDeleted = false")
                .select(["taxAbleMaster.id", "taxAbleMaster.name", "taxAbleMaster.price", "taxAbleMaster.isActive", "taxAbleMaster.isTaxable"]);

            const getTaxAbleMaster = await listQuery.getOne();
            return getTaxAbleMaster;

        } catch (error) {
            throwException(error);
        }
    }
    async fetchTaxAbleMaster(query): Promise<{ taxAbleList: TavtTaxableMaster[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(TavtTaxableMaster, "taxAbleMaster")
                .andWhere("taxAbleMaster.isDeleted = false")
                .select(["taxAbleMaster.id", "taxAbleMaster.name", "taxAbleMaster.price",
                    "taxAbleMaster.isActive", "taxAbleMaster.isTaxable"])
            if (query) {
                listQuery.offset(parseInt(query.offset) * parseInt(query.limit));
                listQuery.limit(query.limit);
                listQuery.orderBy(`taxAbleMaster.${query.orderBy}`, query.orderDir);
            }

            if (query?.search) {
                const searchPattern = `%${query.search}%`;
                listQuery.andWhere("(taxAbleMaster.name ILIKE :search OR CAST(taxAbleMaster.price AS TEXT) LIKE :search)", {
                    search: searchPattern
                });
            }

            if (query?.isTaxable) {
                listQuery.andWhere("taxAbleMaster.isTaxable = :isTaxable", { isTaxable: query.isTaxable });
            }

            const taxAbleList = await listQuery.getManyAndCount();
            if (query) {
                query.count = taxAbleList[1];
            }
            return { taxAbleList: taxAbleList[0], page: query };
        } catch (error) {
            throwException(error);
        }
    }
    async deleteTaxAbleMasters(taxAble, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TavtTaxableMaster,
                taxAble,
                userId,
                success.SUC_TAX_ABLE_MASTER_DELETED,
                error.ERR_TAX_ABLE_MASTER_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
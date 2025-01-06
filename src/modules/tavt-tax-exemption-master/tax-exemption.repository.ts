import { DataSource, Not, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from 'src/shared/utility/throw-exception';
import { SaveTaxExemptionMasterDto } from './dto/add-tax-exemption.dto';
import { TavtTaxExemptionMaster } from 'src/shared/entity/tavt-exemption-master.entity';
import { checkStateExists, commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class TavtTaxExemptionMasterRepository extends Repository<TavtTaxExemptionMaster> {
    constructor(readonly dataSource: DataSource,) {
        super(TavtTaxExemptionMaster, dataSource.createEntityManager());
    }


    async saveTaxExemptionMaster(taxExemptionMasterDto: SaveTaxExemptionMasterDto, id, user): Promise<{ message: string, data: any }> {
        try {
            const state = await checkStateExists(taxExemptionMasterDto.stateId);
            let message;
            let data;
            if (parseInt(id)) {
                const taxExemptionMaster = await TavtTaxExemptionMaster.findOne({ where: { id } });
                if (!taxExemptionMaster) throw new NotFoundException(`ERR_TAX_EXEMPTION_MASTER_NOT_FOUND&&&id`);

                // Check for duplicate exemption
                const duplicateExemption = await TavtTaxExemptionMaster.findOne({
                    where: { exemption: taxExemptionMasterDto.exemption, id: Not(id) }
                });
                if (duplicateExemption) throw new ConflictException(`ERR_TAX_EXEMPTION_EXIST`);

                taxExemptionMaster.exemption = taxExemptionMasterDto.exemption;
                taxExemptionMaster.stateId = state.id;
                taxExemptionMaster.rate = taxExemptionMasterDto.rate;
                taxExemptionMaster.exemptionType = taxExemptionMasterDto.exemptionType;
                taxExemptionMaster.description = taxExemptionMasterDto.description;
                taxExemptionMaster.isActive = taxExemptionMasterDto.isActive;
                taxExemptionMaster.requiredForms = taxExemptionMasterDto.requiredForms;

                data = await taxExemptionMaster.save();
                message = "SUC_TAX_EXEMPTION_MASTER_UPDATED";
            } else {
                // Check for duplicate exemption
                const duplicateExemption = await TavtTaxExemptionMaster.findOne({ where: { exemption: taxExemptionMasterDto.exemption } });
                if (duplicateExemption) throw new ConflictException(`ERR_TAX_EXEMPTION_EXIST`);

                const taxExemptionMaster = TavtTaxExemptionMaster.create({ ...taxExemptionMasterDto, stateId: state.id, createdBy: user.id });
                data = await taxExemptionMaster.save();
                message = "SUC_TAX_EXEMPTION_MASTER_ADDED";
            }

            const responseData = {
                id: data.id,
                exemption: data.exemption,
                stateId: data.stateId,
                rate: data.rate,
                exemptionType: data.exemptionType,
                description: data.description,
                isActive: data.isActive,
                requiredForms: data.requiredForms
            };

            return { message, data: responseData };
        } catch (error) {
            throwException(error);
        }
    }

    async getTaxExemptionMaster(id) {
        try {
            let listQuery = this.manager.createQueryBuilder(TavtTaxExemptionMaster, "taxExemptionMaster")
                .leftJoinAndSelect("taxExemptionMaster.titleState", "state")
                .where("taxExemptionMaster.id = :id", { id: +id })
                .andWhere("taxExemptionMaster.isDeleted = false")
                .select(["taxExemptionMaster.id", "taxExemptionMaster.stateId", "taxExemptionMaster.exemption", "taxExemptionMaster.isActive",
                    "taxExemptionMaster.requiredForms", "taxExemptionMaster.description", "taxExemptionMaster.exemptionType",
                    "taxExemptionMaster.rate", "state.id", "state.name"])
                .getOne();

            return listQuery;

        } catch (error) {
            throwException(error);
        }
    }
    async fetchTaxExemptionMaster(query): Promise<{ taxExemptionList: TavtTaxExemptionMaster[], page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(TavtTaxExemptionMaster, "taxExemptionMaster")
                .andWhere("taxExemptionMaster.isDeleted = false")
                .leftJoin("taxExemptionMaster.titleState","titleState")
                .select(["taxExemptionMaster.id", "taxExemptionMaster.stateId", "taxExemptionMaster.exemption", "taxExemptionMaster.isActive",
                    "taxExemptionMaster.requiredForms", "taxExemptionMaster.description", "taxExemptionMaster.exemptionType",
                    "taxExemptionMaster.rate","titleState.name","titleState.code"]);


            if (query?.search) {
                const searchPattern = `%${query.search}%`;
                listQuery.andWhere("(taxExemptionMaster.exemption ILIKE :search OR CAST(taxExemptionMaster.rate AS TEXT) LIKE :search)", {
                    search: searchPattern
                });
            }

            if (query?.exemptionType) {
                listQuery.andWhere("taxExemptionMaster.exemptionType = :exemptionType", { exemptionType: query.exemptionType });
            }

            if (query) {
                listQuery.offset(parseInt(query.offset) * parseInt(query.limit));
                listQuery.limit(parseInt(query.limit));
                listQuery.orderBy(`taxExemptionMaster.${query.orderBy}`, query.orderDir);
            }

            const taxExemptionList = await listQuery.getManyAndCount();

            if (query) {
                query.count = taxExemptionList[1];
            }
            return { taxExemptionList: taxExemptionList[0], page: query };
        } catch (error) {
            throwException(error);
        }
    }
    async deleteTaxExemptions(exemption, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TavtTaxExemptionMaster,
                exemption,
                userId,
                success.SUC_TAX_EXEMPTION_MASTER_DELETED,
                error.ERR_TAX_EXEMPTION_MASTER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}
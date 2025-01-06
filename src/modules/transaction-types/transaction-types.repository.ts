import { TransactionTypes } from '../../shared/entity/transaction-types.entity';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AddTransactionTypesDto } from './dto/add-transaction-type.dto';
import { throwException } from "../../shared/utility/throw-exception";
import { IsActive } from 'src/shared/enums/is-active.enum';
import { CustomerTransactionTypes } from 'src/shared/entity/customer-transaction-types.entity';
import { Customers } from 'src/shared/entity/customers.entity';
import { checkTransactionTypeExists, commonDeleteHandler, formatPrice } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import { TransactionTypesTeams } from 'src/shared/entity/transaction-types-teams.entity';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { ChunkConst } from 'src/shared/constants/common.constant';


@Injectable()
export class TransactionTypesRepository extends Repository<TransactionTypes> {
    constructor(readonly dataSource: DataSource) {
        super(TransactionTypes, dataSource.createEntityManager());
    }

    async addTransactionTypes(addTransactionTypes: AddTransactionTypesDto, userId: number): Promise<TransactionTypes> {
        try {
            await this.checkNameDuplication(addTransactionTypes.name.toLowerCase(), null)
            await this.checkTransactionCodeDuplication(addTransactionTypes.transactionCode.toLowerCase(), null)

            let { price } = addTransactionTypes;
            price = formatPrice(price);

            //create new transaction type
            const transactionTypes = {
                ...addTransactionTypes, price, createdBy: userId
            }
            const transactionType = await this.save(transactionTypes);

            //Transaction teams data
            if (addTransactionTypes.teamIds.length) {
                const teamData = addTransactionTypes.teamIds.map(element => ({
                    teamId: element,
                    transactionTypeId: transactionType.id,
                    createdBy: userId
                }))
                await this.teamsTransactionMapping(teamData)
            }

            //Customer Transaction mapping
            const customerTransactionTypes = await Customers.find({ select: ["id"] });
            if (customerTransactionTypes.length) {
                const cusTransactionTypeBulk: any = customerTransactionTypes.map(e => ({
                    customerId: e.id,
                    transactionTypesId: transactionType.id,
                    customerTransactionType: null,
                    price: transactionType.price,
                    createdBy: userId
                }));
                this.customerTransactionMapping(cusTransactionTypeBulk);
            }

            return transactionType;
        } catch (error) {
            throwException(error);
        }
    }

    async customerTransactionMapping(data) {
        try {
            // Helper function to chunk the data
            const chunkArray = (array, chunkSize) => {
                const chunks = [];
                for (let i = 0; i < array.length; i += chunkSize) {
                    chunks.push(array.slice(i, i + chunkSize));
                }
                return chunks;
            };

            const dataChunks = chunkArray(data, ChunkConst.cusTranMapping);

            for (const chunk of dataChunks) {
                await this.manager.createQueryBuilder()
                    .insert()
                    .into(CustomerTransactionTypes)
                    .values(chunk)
                    .execute();
            }
        } catch (error) {
            throw new BadRequestException(`ERR_STORING_DATA&&&customerTransactionMapping&&&ERROR_MESSAGE`);
        }
    }

    async teamsTransactionMapping(data) {
        try {
            await this.manager.createQueryBuilder()
                .insert()
                .into(TransactionTypesTeams)
                .values(data)
                .execute();
        } catch (error) {
            throw new BadRequestException(`ERR_STORING_DATA&&&teamsTransactionMapping&&&ERROR_MESSAGE`);
        }
    }

    async removeTransactionTeams(transactionTypeId: number, teamIds: number[]) {
        try {
            const query = this.manager.createQueryBuilder(TransactionTypesTeams, 'transactionType')
                .delete()
                .where("transactionTypeId = :transactionTypeId", { transactionTypeId })

            if (teamIds.length) {
                query.andWhere("(teamId IN (:...teamIds))", { teamIds })
            }

            await query.execute();
        } catch (error) {
            throw new BadRequestException(`ERR_DELETING_DATA&&&removeTransactionTeams&&&ERROR_MESSAGE`);
        }
    }

    async fetchAllTransactionTypes(filterDto?: any): Promise<{ transactionTypes: TransactionTypes[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(TransactionTypes, "transactionTypes")
                .select([
                    "transactionTypes.id", "transactionTypes.name", "transactionTypes.price",
                    "transactionTypes.state", "transactionTypes.isActive", "transactionTypes.transactionCode"
                ])
                .where("(transactionTypes.isDeleted = false)")

            if (filterDto) {
                listQuery.offset(filterDto.offset * filterDto.limit);
                listQuery.limit(filterDto.limit);
                listQuery.orderBy(`transactionTypes.${filterDto.orderBy}`, filterDto.orderDir, 'NULLS LAST');
            }

            if (filterDto?.search) {
                listQuery.andWhere(
                    "(transactionTypes.name ilike :search or transactionTypes.state ilike :search or transactionTypes.transactionCode ilike :search)",
                    { search: `%${filterDto.search}%` }
                );
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("transactionTypes.isActive = true")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("transactionTypes.isActive = false")
            }

            const transactionTypesWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = transactionTypesWithCount[1];
            }

            return { transactionTypes: transactionTypesWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async fetchTransactionTypeDetail(id: number): Promise<TransactionTypes> {
        try {
            return this.createQueryBuilder("transactionTypes")
                .leftJoinAndSelect("transactionTypes.teamTransactionType", "teamTransactionType")
                .leftJoinAndSelect("teamTransactionType.team", "team")
                .select([
                    "transactionTypes.id", "transactionTypes.name", "transactionTypes.slug",
                    "transactionTypes.transactionCode", "transactionTypes.price",
                    "transactionTypes.state", "transactionTypes.createdAt", "transactionTypes.isActive",
                    "teamTransactionType.id",
                    "team.id", "team.name"
                ])
                .where("(transactionTypes.id = :id AND transactionTypes.isDeleted = false)", { id })
                .getOne();
        } catch (error) {
            throwException(error);
        }
    }

    async editTransactionTypes(updateTransactionTypeDto: UpdateTransactionTypeDto, id: number, userId: number): Promise<TransactionTypes> {
        try {
            const { price, state, transactionCode, isActive, name } = updateTransactionTypeDto;

            // Check transaction type exists with given ID
            const transactionTypesExist = await checkTransactionTypeExists(id)

            if (name) {
                await this.checkNameDuplication(name.toLowerCase(), id)

                transactionTypesExist.name = name;
            }

            if (transactionCode) {
                await this.checkTransactionCodeDuplication(transactionCode.toLowerCase(), id)

                transactionTypesExist.transactionCode = transactionCode;
            }

            transactionTypesExist.price = formatPrice(price) || formatPrice(transactionTypesExist.price);
            transactionTypesExist.state = state || transactionTypesExist.state;
            transactionTypesExist.isActive = isActive;
            transactionTypesExist.updatedBy = userId;
            await transactionTypesExist.save();

            //team data
            if (updateTransactionTypeDto?.teamData?.length) {
                const { newTeamIds, removeTeamIds } = updateTransactionTypeDto.teamData.reduce((acc, e) => {
                    e.isAdd ? acc.newTeamIds.push(e.teamId) : acc.removeTeamIds.push(e.teamId);
                    return acc;
                }, { newTeamIds: [], removeTeamIds: [] });

                //add
                if (newTeamIds.length) {
                    const transactionTeamsData = newTeamIds.map(element => ({
                        teamId: element,
                        transactionTypeId: id,
                        createdBy: userId
                    }))
                    await this.teamsTransactionMapping(transactionTeamsData)
                }
                //remove
                if (removeTeamIds.length) {
                    await this.removeTransactionTeams(id, removeTeamIds)
                }
            }
            return transactionTypesExist;

        } catch (error) {
            throwException(error);
        }
    }

    async deleteTransactionTypes(transactionType, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                TransactionTypes,
                transactionType,
                userId,
                success.SUC_TRANSACTION_TYPE_DELETED,
                error.ERR_TRANSACTION_TYPE_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }

    async checkNameDuplication(name: string, id) {
        try {
            const query = TransactionTypes.createQueryBuilder("transactionType")
                .select(["transactionType.id", "transactionType.name"])
                .where(`(LOWER(transactionType.name) = :name)`, { name })
                .andWhere(`(transactionType.isDeleted = false)`)
            if (id) {
                query.andWhere(`(transactionType.id != :id)`, { id })
            }
            const checkTransactionType = await query.getOne();

            if (checkTransactionType) {
                throw new ConflictException("ERR_TRANSACTION_NAME_EXIST&&&name");
            }
        } catch (error) {
            throwException(error)
        }
    }

    async checkTransactionCodeDuplication(transactionCode: string, id?: number) {
        try {
            const query = TransactionTypes.createQueryBuilder("transactionType")
                .select(["transactionType.id", "transactionType.name"])
                .where(`(LOWER(transactionType.transactionCode) = :transactionCode)`, { transactionCode })
                .andWhere(`(transactionType.isDeleted = false)`)
            if (id) {
                query.andWhere(`(transactionType.id != :id)`, { id })
            }
            const checkTransactionType = await query.getOne();

            if (checkTransactionType) {
                throw new ConflictException("ERR_TRANSACTION_CODE_EXIST&&&transactionCode");
            }
        } catch (error) {
            throwException(error)
        }
    }
}
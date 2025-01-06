import { Modules } from 'src/shared/entity/modules.entity';
import { DataSource, ILike, Not, Repository } from 'typeorm';
import {
    ConflictException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { AddModulesDto, UpdateModulesDto } from './dto/add-modules.dto';
import { throwException } from "../../shared/utility/throw-exception";


@Injectable()
export class ModulesRepository extends Repository<Modules> {
    constructor(readonly dataSource: DataSource) {
        super(Modules, dataSource.createEntityManager());
    }

    async addModules(addModules: AddModulesDto, user): Promise<Modules> {
        try {
            const module = await this.findOne({
                where: {
                    name: ILike(`%${addModules.name}%`),
                    isDeleted: false
                }
            })
            if (module) {
                throw new ConflictException("ERR_MODULE_EXIST&&&name");
            }
            const modules = new Modules();
            modules.name = addModules.name;
            modules.moduleId = addModules.moduleId;
            modules.createdBy = user.id;
            const res = await modules.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllModules(filterDto): Promise<{ moduless: Modules[]; page: object }> {
        try {
            const listQuery = this.manager.createQueryBuilder(Modules, "modules")
                .select(["modules.id", "modules.name"])
                .where("(modules.isDeleted = false)")

            if (filterDto) {
                listQuery.skip(filterDto.offset * filterDto.limit);
                listQuery.take(filterDto.limit);
                listQuery.orderBy(`modules.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const modulessWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = modulessWithCount[1];
            }

            return { moduless: modulessWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editModules(updateModules: UpdateModulesDto, id, user): Promise<Modules> {
        try {
            // Check user exists with given ID
            const modulesExist = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!modulesExist) throw new NotFoundException(`ERR_MODULE_NOT_FOUND`);

            const module = await this.findOne({
                where: {
                    id: Not(id),
                    name: ILike(`%${updateModules.name}%`),
                    isDeleted: false
                }
            })
            if (module) {
                throw new ConflictException("ERR_MODULE_EXIST&&&name");
            }

            modulesExist.name = updateModules.name;
            modulesExist.moduleId = updateModules.moduleId;
            modulesExist.updatedBy = user.id;
            await modulesExist.save();
            return modulesExist;
        } catch (error) {
            throwException(error);
        }
    }
}

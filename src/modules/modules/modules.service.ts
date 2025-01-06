import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ModulesRepository } from "./modules.repository";
import { AddModulesDto, UpdateModulesDto } from "./dto/add-modules.dto";
import { PageQueryDto } from "../../shared/dtos/list-query.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";

@Injectable()
export class ModulesService {
    constructor(
        @InjectRepository(ModulesRepository)
        private readonly modulesRepository: ModulesRepository
    ) { }

    async addModules(addModules: AddModulesDto, user): Promise<AppResponse> {
        try {
            const createModules = await this.modulesRepository.addModules(addModules, user);
            return {
                message: "SUC_MODULE_CREATED",
                data: createModules
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getModulesList(query: PageQueryDto): Promise<AppResponse> {
        try {
            const { moduless, page } = await this.modulesRepository.fetchAllModules(query);
            return {
                message: "SUC_MODULE_LIST_FETCHED",
                data: { moduless, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch modules details from ID
     * @author Devang
     * @param id  => Modules id
     */
    async getModules(id): Promise<AppResponse> {
        try {
            // Check modules exists with given ID
            const getmodules = await this.modulesRepository.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!getmodules) {
                throw new NotFoundException(`ERR_MODULE_NOT_FOUND`);
            }
            return {
                message: "SUC_MODULE_DETAILS_FETCHED",
                data: getmodules
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editModules(updateModules: UpdateModulesDto, id, user): Promise<AppResponse> {
        try {
            await this.modulesRepository.editModules(updateModules, id, user);
            return {
                message: "SUC_MODULE_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteModules(id, user): Promise<AppResponse> {
        try {
            // Check modules exists with given ID
            const getModule = await this.modulesRepository.findOne({
                where: { id: id, isDeleted: false }
            });
            if (!getModule) {
                throw new NotFoundException(`ERR_MODULE_NOT_FOUND`);
            }

            getModule.isDeleted = true;
            getModule.updatedBy = user.id;
            await getModule.save();

            return {
                message: "SUC_MODULE_DELETED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

}

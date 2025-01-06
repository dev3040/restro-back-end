import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DepartmentsRepository } from "./departments.repository";
import { AddDepartmentDto, UpdateDepartmentDto } from "./dto/add-department.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { ListDepartmentsDto } from "../../shared/dtos/list-data.dto";

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(DepartmentsRepository)
        private readonly departmentsRepository: DepartmentsRepository
    ) { }

    async addDepartment(addDepartment: AddDepartmentDto, user: User): Promise<AppResponse> {
        try {
            const createDepartments = await this.departmentsRepository.addDepartment(addDepartment, user);
            return {
                message: "SUC_DEPARTMENT_CREATED",
                data: createDepartments
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getDepartmentList(query: ListDepartmentsDto): Promise<AppResponse> {
        try {
            const { departments, page } = await this.departmentsRepository.fetchAllDepartments(query);
            return {
                message: "SUC_DEPARTMENT_LIST_FETCHED",
                data: { departments, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    /**
     * Fetch departments details from ID
     * @author Ishita
     * @param id  => Departments id
     */
    async getDepartment(id): Promise<AppResponse> {
        try {
            // Check departments exists with given ID
            const getDepartments = await this.departmentsRepository.findOne({
                where: { id: id }
            });
            if (!getDepartments) {
                throw new NotFoundException(`ERR_DEPARTMENT_NOT_FOUND`);
            }
            return {
                message: "SUC_DEPARTMENT_DETAILS_FETCHED",
                data: getDepartments
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editDepartment(updateDepartments: UpdateDepartmentDto, id, user): Promise<AppResponse> {
        try {
            await this.departmentsRepository.editDepartment(updateDepartments, id, user);
            return {
                message: "SUC_DEPARTMENT_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDepartments(deleteDepartment, userId): Promise<AppResponse> {
        try {
            const response = await this.departmentsRepository.deleteDepartments(deleteDepartment, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}


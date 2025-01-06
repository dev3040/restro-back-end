import { Departments } from '../../shared/entity/departments.entity';
import { DataSource, ILike, Not, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { AddDepartmentDto, UpdateDepartmentDto } from './dto/add-department.dto';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';

@Injectable()
export class DepartmentsRepository extends Repository<Departments> {
    constructor(readonly dataSource: DataSource) {
        super(Departments, dataSource.createEntityManager());
    }

    async addDepartment(addDepartment: AddDepartmentDto, user): Promise<Departments> {
        try {

            const departmentExist = await this.manager.createQueryBuilder(Departments, "department")
                .select(["department.id", "department.name"])
                .where(`(LOWER(department.name) = :name)`, {
                    name: `${addDepartment.name.toLowerCase()}`
                })
                .andWhere(`(department.isDeleted = false)`)
                .getOne();
            if (departmentExist) {
                throw new ConflictException("ERR_DEPARTMENT_EXIST&&&name");
            }

            const department = new Departments();
            department.name = addDepartment.name;
            department.createdBy = user.id;
            department.isActive = addDepartment.isActive;
            const res = await department.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllDepartments(filterDto): Promise<{ departments: Departments[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(Departments, "departments")
                .select(["departments.id", "departments.name", "departments.isActive", "departments.createdAt"])
                .where("(departments.isDeleted = false)")

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }

                if (filterDto.search) {
                    listQuery.andWhere("(departments.name ilike :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(departments.isActive = true)")
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(departments.isActive = false)")
                }

                listQuery.orderBy(`departments.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const departmentsWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = departmentsWithCount[1];
            }

            return { departments: departmentsWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async editDepartment(updateDepartment: UpdateDepartmentDto, id, user): Promise<Departments> {
        try {
            // Check user exists with given ID
            const departmentsExist = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!departmentsExist) throw new NotFoundException(`ERR_DEPARTMENT_NOT_FOUND`);

            const departmentFind = await this.manager.createQueryBuilder(Departments, "department")
                .select(["department.id", "department.name"])
                .where(`(LOWER(department.name) = :name)`, {
                    name: `${this.addDepartment.name.toLowerCase()}`
                })
                .andWhere(`(department.isDeleted = false)`)
                .andWhere(`(department.id != :id)`, { id })
                .getOne();
            if (departmentFind) {
                throw new ConflictException("ERR_DEPARTMENT_EXIST&&&name");
            }

            const department = await this.findOne({
                where: {
                    id: Not(id),
                    name: ILike(`%${updateDepartment.name}%`),
                    isDeleted: false
                }
            })
            if (department) {
                throw new ConflictException("ERR_DEPARTMENT_EXIST&&&name");
            }
            departmentsExist.name = updateDepartment.name;
            departmentsExist.isActive = updateDepartment.isActive;
            departmentsExist.updatedBy = user.id;
            await departmentsExist.save();
            return departmentsExist;
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDepartments(deleteDepartments, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                Departments,
                deleteDepartments,
                userId,
                success.SUC_DEPARTMENT_DELETED,
                error.ERR_DEPARTMENT_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CustomerRepository } from "./customer-management..repository";
import { AddCustomerDto, UpdateCustomerDto } from "./dto/add-customer.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { User } from "src/shared/entity/user.entity";
import { ListDepartmentsDto } from "../../shared/dtos/list-data.dto";

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(CustomerRepository)
        private readonly customerRepository: CustomerRepository
    ) { }

    async addDepartment(addDepartment: AddCustomerDto, user: User): Promise<AppResponse> {
        try {
            const createDepartments = await this.customerRepository.addCustomer(addDepartment, user);
            return {
                message: "SUC_CUSTOMER_CREATED",
                data: createDepartments
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getDepartmentList(query: ListDepartmentsDto): Promise<AppResponse> {
        try {
            const { customers, page } = await this.customerRepository.fetchAllCustomers(query);
            return {
                message: "SUC_CUSTOMER_LIST_FETCHED",
                data: { customers, page }
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
            const getDepartments = await this.customerRepository.findOne({
                where: { id: id }
            });
            if (!getDepartments) {
                throw new NotFoundException(`ERR_CUSTOMER_NOT_FOUND`);
            }
            return {
                message: "SUC_CUSTOMER_DETAILS_FETCHED",
                data: getDepartments
            };
        } catch (error) {
            throwException(error);
        }
    }

    async editDepartment(updateDepartments: UpdateCustomerDto, id, user): Promise<AppResponse> {
        try {
            await this.customerRepository.editCustomer(updateDepartments, id, user);
            return {
                message: "SUC_CUSTOMER_UPDATED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteDepartments(deleteDepartment, userId): Promise<AppResponse> {
        try {
            const response = await this.customerRepository.deleteDepartments(deleteDepartment, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}


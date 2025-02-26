
import { DataSource, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { throwException } from "../../shared/utility/throw-exception";
import { AddCustomerDto, UpdateCustomerDto } from './dto/add-customer.dto';
import { IsActive } from 'src/shared/enums/is-active.enum';
import { commonDeleteHandler } from 'src/shared/utility/common-function.methods';
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';
import { Customers } from 'src/shared/entity/customers.entity';

@Injectable()
export class CustomerRepository extends Repository<Customers> {
    constructor(readonly dataSource: DataSource) {
        super(Customers, dataSource.createEntityManager());
    }

    async addCustomer(addCustomerDto: AddCustomerDto, user): Promise<Customers> {
        try {
            const customer = new Customers();
            customer.name = addCustomerDto.name;
            customer.email = addCustomerDto.email;
            customer.phone = addCustomerDto.phone;
            customer.address = addCustomerDto.address;
            customer.state = addCustomerDto.state;
            customer.street = addCustomerDto.street;
            customer.birthDate = addCustomerDto.birthDate ? new Date(addCustomerDto.birthDate) : null;
            customer.anniversaryDate = addCustomerDto.anniversaryDate ? new Date(addCustomerDto.anniversaryDate) : null;
            customer.isActive = addCustomerDto.isActive;
            customer.createdBy = user.id;

            const res = await customer.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllCustomers(filterDto): Promise<{ customers: Customers[]; page: object }> {
        try {
            const listQuery = this.manager
                .createQueryBuilder(Customers, "customers")
                .select(["customers"])
                .where("(customers.isDeleted = false)");

            if (filterDto) {
                if (filterDto.offset && filterDto.limit) {
                    listQuery.skip(filterDto.offset * filterDto.limit);
                    listQuery.take(filterDto.limit);
                }

                if (filterDto.search) {
                    listQuery.andWhere("(customers.name ilike :search OR customers.email ilike :search OR customers.phone ilike :search)", { search: `%${filterDto.search}%` });
                }

                if (filterDto?.activeStatus == IsActive.ACTIVE) {
                    listQuery.andWhere("(customers.isActive = true)");
                }
                if (filterDto?.activeStatus == IsActive.INACTIVE) {
                    listQuery.andWhere("(customers.isActive = false)");
                }

                listQuery.orderBy(`customers.${filterDto.orderBy}`, filterDto.orderDir);
            }

            const customersWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = customersWithCount[1];
            }

            return { customers: customersWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }



    async editCustomer(updateCustomer: UpdateCustomerDto, id, user): Promise<Customers> {
        try {
            const customerExist = await this.findOne({ where: { id: id, isDeleted: false } });
            if (!customerExist) throw new NotFoundException(`ERR_CUSTOMER_NOT_FOUND`);

            const customerFind = await this.manager.createQueryBuilder(Customers, "customer")
                .select(["customer.id", "customer.name"])
                .where(`customer.id = :id`, { id })
                .andWhere(`customer.isDeleted = false`)
                .getOne();

            if (!customerFind) {
                throw new ConflictException("ERR_CUSTOMER_NOT_FOUND&&&id");
            }

            customerExist.name = updateCustomer.name;
            customerExist.email = updateCustomer.email;
            customerExist.phone = updateCustomer.phone;
            customerExist.address = updateCustomer.address;
            customerExist.state = updateCustomer.state;
            customerExist.street = updateCustomer.street;
            customerExist.birthDate = updateCustomer.birthDate ? new Date(updateCustomer.birthDate) : null;
            customerExist.anniversaryDate = updateCustomer.anniversaryDate ? new Date(updateCustomer.anniversaryDate) : null;
            customerExist.isActive = updateCustomer.isActive;
            customerExist.updatedBy = user.id;

            await customerExist.save();
            return customerExist;
        } catch (error) {
            throwException(error);
        }
    }


    async deleteDepartments(deleteDepartments, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                Customers,
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

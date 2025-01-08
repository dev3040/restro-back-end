import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UserRepository } from "./user.repository";
import { User } from "src/shared/entity/user.entity";
import { UpdateUserDto } from "./dto/edit-user.dto";
import { throwException } from "../../shared/utility/throw-exception";
import { AppResponse } from "../../shared/interfaces/app-response.interface";
import { EditUser } from "./interface/common.interface";
import { SignupUserDto } from "./dto/sign-up-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { checkUserDepartment, checkUserExists } from "src/shared/utility/common-function.methods";
import { ListUsersDto } from "src/shared/dtos/list-data.dto";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) { }

    async signUp(createUser: SignupUserDto): Promise<AppResponse> {
        try {

            const { firstName, lastName, email, password } = createUser;

            const userExist = await this.userRepository.findOne({ where: { email: email.toLocaleLowerCase(), isDeleted: false } });

            if (userExist) throw new ConflictException(`ERR_EMAIL_EXIST&&&email`);

            const user = new User();
            const salt = await bcrypt.genSalt();
            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email.toLowerCase();
            user.salt = salt;
            user.password = password;
            user.branchId = createUser.branchId;
            await user.save();

            return {
                message: "SUC_USER_REGISTER"
            };
        } catch (error) {
            throwException(error);
        }
    }


    async getUser(id: number): Promise<AppResponse> {
        try {
            // Check user exists with given ID
            const user = await this.userRepository.getUser(id);
            return {
                message: "SUC_USER_FETCH",
                data: { user }
            };

        } catch (error) {
            throwException(error);
        }
    }

    async editUser(updateUser: UpdateUserDto, data: EditUser): Promise<AppResponse> {
        try {
            await this.userRepository.editUser(updateUser, data);
            return {
                message: "SUC_USER_UPDATED"
            };
        } catch (error) {
            throwException(error);
        }
    }

    async getUserList(query: ListUsersDto): Promise<AppResponse> {
        try {
            const { users, page } = await this.userRepository.fetchAllUsers(query);
            return {
                message: "SUC_USER_LIST_FETCHED",
                data: { users, page }
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteUserDepartment(userId, departmentId): Promise<AppResponse> {
        try {
            const data = await checkUserDepartment(departmentId, userId)

            await this.userRepository.deleteUserDepartment(data.id)

            return {
                message: "SUC_TICKET_TAG_REMOVED",
                data: {}
            };
        } catch (error) {
            throwException(error);
        }
    }

    async createUser(createUser: CreateUserDto): Promise<AppResponse> {
        return this.userRepository.createUser(createUser)
    }


    async activeInactiveUser(id, user): Promise<AppResponse> {
        try {
            const userExist = await checkUserExists(id)
            userExist.isActive = !userExist.isActive;
            userExist.updatedBy = user.id;
            await userExist.save();

            return {
                message: userExist.isActive
                    ? "SUC_USER_ACTIVATED_UPDATED"
                    : "SUC_USER_DEACTIVATED_UPDATED",
                data: userExist
            };
        } catch (error) {
            throwException(error);
        }
    }

    async deleteUsers(deleteUsers, userId): Promise<AppResponse> {
        try {
            const response = await this.userRepository.deleteUsers(deleteUsers, userId);
            return response;
        } catch (error) {
            throwException(error);
        }
    }


}

import { Otp } from "src/shared/entity/otp.entity";
import { User } from "src/shared/entity/user.entity";
import { DataSource, Not, Repository } from "typeorm";
import { UpdateUserDto } from "./dto/edit-user.dto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { throwException } from "../../shared/utility/throw-exception";
import { OtpType } from "src/shared/enums/otp-type.enum";
import { OtpLeftTime } from "../auth/interface/common.interface";
import { EditUser, OtpData, UserStatusChange } from "./interface/common.interface";
import { IsActive } from "src/shared/enums/is-active.enum";
import { CreateUserDto } from "./dto/create-user.dto";
import { checkDepartmentDataExists, checkUserExists, commonDeleteHandler } from "src/shared/utility/common-function.methods";
import { AppResponse } from "src/shared/interfaces/app-response.interface";
import { UserDepartments } from "src/shared/entity/user-departments.entity";
import error from '../../i18n/en/error.json';
import success from '../../i18n/en/success.json';


@Injectable()
export class UserRepository extends Repository<User> {
    constructor(readonly dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async getOtpData(otpData: OtpData) {
        try {
            const { userId, otp, otpType } = otpData;

            const result = await this.manager
                .createQueryBuilder(Otp, "otp")
                .where("otp.user_id =:userId", { userId })
                .andWhere("otp.otp =:otp", { otp })
                .andWhere("otp.type =:otpType", { otpType: otpType })
                .orderBy("created_at", "DESC")
                .getOne();

            return result;
        } catch (error) {
            throwException(error);
        }
    }

    async getUser(id) {
        try {
            const user = await this.manager
                .createQueryBuilder(User, "user")
                .leftJoinAndSelect("user.branch", "branch")
                .select(["user.firstName", "user.lastName", "user.email", "user.isActive", "branch"])
                .where("user.id =:id", { id })
                .getOne();

            if (!user) {
                throw new NotFoundException(`ERR_USER_NOT_FOUND&&&id`);
            }
            return user;
        } catch (error) {
            throwException(error);
        }
    }

    async editUser(updateUser: UpdateUserDto, data: EditUser) {
        try {
            const { userId, loginUserId } = data;
            const { email, branchId } = updateUser;

            const userExists = await checkUserExists(userId)

            if (email) {
                // Check if Duplicate Email
                const emailExists = await this.findOne({
                    where: {
                        email: email,
                        id: Not(userId),
                        isDeleted: false
                    }
                });
                if (emailExists) throw new ConflictException(`ERR_EMAIL_EXIST&&&email`);
            }


            userExists.firstName = updateUser?.firstName;
            userExists.lastName = updateUser?.lastName;
            userExists.email = updateUser?.email;
            userExists.isActive = updateUser.isActive;
            userExists.updatedBy = loginUserId;
            userExists.branchId = branchId
            await userExists.save();

            return userExists;
        } catch (error) {
            throwException(error);
        }
    }

    async addUser(addUser: CreateUserDto, userId) {
        try {
            const user = new User();
            const salt = await bcrypt.genSalt();
            user.firstName = addUser.firstName;
            user.lastName = addUser.lastName;
            user.email = addUser.email;
            user.password = addUser.password;
            user.salt = salt;
            user.createdBy = userId;
            await user.save();
            return user;
        } catch (error) {
            throwException(error);
        }
    }

    async changeStatus(user: User, statusObj: UserStatusChange) {
        try {
            const { status, loginUserId } = statusObj;
            user.isActive = status === true ? true : false;
            user.updatedBy = loginUserId;
            const res = await user.save();
            return res;
        } catch (error) {
            throwException(error);
        }
    }

    async fetchAllUsers(filterDto) {
        try {
            const listQuery = this.manager.createQueryBuilder(User, "user")
                .leftJoinAndSelect("user.departmentUser", "departmentUser")
                .leftJoinAndSelect("departmentUser.department", "department")
                .select([
                    "user.id",
                    "user.firstName",
                    "user.lastName",
                    "user.email",
                    "user.isActive",
                    "departmentUser.departmentId",
                    "department.id", "department.name"
                ])
                .where("(user.isDeleted = false)")
            if (filterDto?.search) {
                listQuery.andWhere("( (user.email like :search) OR (CONCAT(first_name,' ',last_name) ILIKE '%' || :keyword || '%'))",
                    { search: `%${filterDto.search}%`, keyword: filterDto.search });
            }

            if (filterDto?.activeStatus == IsActive.ACTIVE) {
                listQuery.andWhere("(user.isActive = true)")
            }
            if (filterDto?.activeStatus == IsActive.INACTIVE) {
                listQuery.andWhere("(user.isActive = false)")
            }

            if (filterDto) {
                listQuery.skip(filterDto.offset * filterDto.limit);
                listQuery.take(filterDto.limit);
                listQuery.orderBy(`user.${filterDto.orderBy}`, filterDto.orderDir);
            }
            const usersWithCount = await listQuery.getManyAndCount();

            if (filterDto) {
                filterDto.count = usersWithCount[1];
            }

            return { users: usersWithCount[0], page: filterDto };
        } catch (error) {
            throwException(error);
        }
    }

    async getOtpLeftTime(otpData: OtpLeftTime) {
        try {
            const { email, otpType } = otpData;
            const getOtp = await this.manager
                .createQueryBuilder(Otp, "otp")
                .leftJoinAndSelect("otp.user", "user")
                .select(["user", "otp"])
                .where("user.email =:email", { email })
                .andWhere("otp.type =:otpType", { otpType: +OtpType[otpType] })
                .orderBy("otp.created_at", "DESC")
                .getOne();

            return getOtp;
        } catch (error) {
            throwException(error);
        }
    }

    async getAllUsersWithDeviceToken() {
        try {
            const users = await this.createQueryBuilder("user")
                .leftJoinAndSelect("user.userDeviceDetails", "userDevice")
                .where("user.isActive = true")
                .getMany();

            return users;
        } catch (error) {
            throwException(error);
        }
    }

    async createUser(createUser: CreateUserDto): Promise<AppResponse> {
        try {
            const { firstName, lastName, email, password, departments } = createUser;

            const userExist = await this.findOne({
                where: {
                    email: email.toLocaleLowerCase(),
                    isDeleted: false
                }
            });
            if (userExist) throw new ConflictException(`ERR_EMAIL_EXIST&&&email`);

            let arr = []
            if (departments !== undefined && departments?.length) {
                arr = departments.map(e => +e)
                arr = [...new Set(arr)];
                await checkDepartmentDataExists(arr)

            }

            const salt = await bcrypt.genSalt();

            const user = new User();
            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email.toLowerCase();
            user.salt = salt;
            user.password = password;
            user.createdBy = user.id;
            await user.save();

            if (arr.length) {
                const data = arr.map(e => ({
                    departmentId: e,
                    userId: user.id,
                    createdBy: user.id
                }));
                await this.mapUserDepartment(data)
            }

            return { message: "SUC_USER_CREATED" };
        } catch (error) {
            throwException(error);
        }
    }

    async mapUserDepartment(data) {
        try {
            await this.manager.createQueryBuilder()
                .insert()
                .into(UserDepartments)
                .values(data)
                .execute();

        } catch (err) {
            throw new BadRequestException(`${err}&&&departments&&&ERROR_MESSAGE`)
        }
    }

    async deleteUserDepartment(id) {
        try {
            await this.manager
                .createQueryBuilder(UserDepartments, 'ud')
                .delete()
                .where("id = :id", { id })
                .execute();
        } catch (error) {
            throw new BadRequestException(`${error}&&&&&&ERROR_MESSAGE`);
        }
    }

    async deleteUsers(deleteUsers, userId) {
        try {
            const response = await commonDeleteHandler(
                this.dataSource,  // dataSource
                User,
                deleteUsers,
                userId,
                success.SUC_USER_DELETED,
                error.ERR_USER_NOT_FOUND
            );
            return response;
        } catch (error) {
            throwException(error);
        }
    }
}

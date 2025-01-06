import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { User } from './user.entity';
import { Departments } from './departments.entity';

@Entity({ name: 'user_departments' })
export class UserDepartments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false, name: 'user_id' })
    userId: number;

    @Column({ type: 'int', nullable: false, name: 'department_id' })
    departmentId: number;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @ManyToOne(() => User, (user) => user.departmentUserCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => Departments, (d) => d.userDepartment)
    @JoinColumn({ name: "department_id", referencedColumnName: "id" })
    department: Departments;

    @ManyToOne(() => User, (u) => u.departmentUser)
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    user: User;

}

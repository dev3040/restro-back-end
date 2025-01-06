import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm';

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

}

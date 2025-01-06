import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { UserDepartments } from './user-departments.entity';
import { FilterBookmarkTeams } from './filter-bookmark-teams.entity';
import { TransactionTypesTeams } from './transaction-types-teams.entity';
import { CommonConst } from '../constants/common.constant';

@Index("departments_name", ["name"], {})

@Entity({ name: 'departments', schema: 'master' })
export class Departments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 100, nullable: true })
    name: string;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string | null;

    @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToMany(() => UserDepartments, (ct) => ct.department)
    userDepartment: UserDepartments[];

    @OneToMany(() => FilterBookmarkTeams, (ct) => ct.team)
    filterBookmarkTeams: FilterBookmarkTeams[];

    @OneToMany(() => TransactionTypesTeams, (ct) => ct.team)
    teamTransaction: TransactionTypesTeams[];
}

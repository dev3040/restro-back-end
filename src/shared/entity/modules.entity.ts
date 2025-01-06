import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CommonConst } from '../constants/common.constant';

@Index("modules_name", ["name"], {})
@Index("modules_module_id", ["moduleId"], {})

@Entity({ name: 'modules', schema: 'master' })
export class Modules extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150 })
    name: string | null;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string | null;

    @Column('int', { name: 'module_id', nullable: true })
    moduleId: number | null;


    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
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

    @ManyToOne(() => User, (user) => user.modulesCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.modulesUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

}

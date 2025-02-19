import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'branches', schema: 'master' })
export class Branches extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 150, })
    name: string;

    @Column('text', { name: 'logo', nullable: true })
    logo: string;

    @Column('varchar', { name: 'code', length: 10, nullable: true })
    code: string | null;

    @Column('varchar', { name: 'prn_num', length: 100, nullable: true })
    prnNum: string | null;

    @Column("text", { nullable: true })
    address: string | null;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=active, false=inactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;


}

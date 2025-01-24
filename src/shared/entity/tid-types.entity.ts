import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CommonConst } from '../constants/common.constant';

@Entity({ name: 'transaction_types', schema: 'master' })
export class TransactionTypes extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 100, nullable: true })
    name: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_active', default: false, comment: "true=deleted, false=not-deleted" })
    isActive: boolean;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string | null;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

}

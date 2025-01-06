import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { CommonConst } from '../constants/common.constant';

@Index("tid_types_name", ["name"], {})

@Entity({ name: 'tid_types', schema: 'master' })
export class TidTypes extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 100, nullable: true })
    name: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

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


    @ManyToOne(() => User, (user) => user.tidTypeCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.tidTypeUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @OneToMany(() => Tickets, (d) => d.tidTypeData)
    ticket: Tickets[];
}

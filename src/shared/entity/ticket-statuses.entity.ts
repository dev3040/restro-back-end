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

@Index("ticket_status_internal_status_name", ["internalStatusName"], {})
@Index("ticket_status_slug", ["slug"], {})

@Entity({ name: 'ticket_status', schema: 'master' })
export class TicketStatuses extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'internal_status_name', length: 100, nullable: true })
    internalStatusName: string;

    @Column('varchar', { name: 'external_status_name', length: 100, nullable: true })
    externalStatusName: string;

    @Column('varchar', { name: 'slug', length: CommonConst.slugLength, nullable: true })
    slug: string | null;

    @Column('smallint', { name: 'order', nullable: true })
    order: number;

    @Column("boolean", { name: "is_active", default: true, comment: "true= Active, false= inactive" })
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

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;


    @ManyToOne(() => User, (user) => user.ticketStatusCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.ticketStatusUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

}

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { Batches } from './batch.entity';

@Entity({ name: 'fedex_labels', schema: 'batch_prep' })
export class FedExDocuments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'ticket_id', nullable: true })
    ticketId: number;

    @Column('int', { name: 'batch_id', nullable: true })
    batchId: number;

    @Column('varchar', { name: 'file_name', length: 255 })
    fileName: string;

    @Column('varchar', { name: 'service_type', length: 255 })
    serviceType: string;

    @Column('varchar', { name: 'tracking_number', length: 255 })
    trackingNumber: string;

    @Column('date', { name: 'ship_date', nullable: true })
    shipDate: Date;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true:deleted, false:not deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_return_label', default: false })
    isReturnLabel: boolean;

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

    @ManyToOne(() => User, (user) => user.ticketStatusUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by", referencedColumnName: "id" })
    createdByUser: User;

    @ManyToOne(() => Batches)
    @JoinColumn({ name: "batch_id", referencedColumnName: "id" })
    batch: Batches;
}
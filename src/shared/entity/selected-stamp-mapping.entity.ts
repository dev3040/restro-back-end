import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { PdfStamp } from './pdf-stamp.entity';


@Entity({ name: 'selected_stamp_mapping', schema: 'data_entry' })
export class SelectedStampMapping extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'ticket_id', nullable: false })
    ticketId: number;

    @Column('bigint', { name: 'stamp_id', nullable: false })
    stampId: number;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => Tickets, (ticket) => ticket.selectedStamp)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => PdfStamp, (stamp) => stamp.selectedStamp)
    @JoinColumn({ name: "stamp_id", referencedColumnName: "id" })
    stamp: PdfStamp;
}

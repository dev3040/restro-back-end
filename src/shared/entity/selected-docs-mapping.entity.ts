import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { TicketDocuments } from './ticket-documents.entity';

@Entity({ name: 'selected_docs_mapping', schema: 'data_entry' })
export class SelectedDocsMapping extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'ticket_id', nullable: false })
    ticketId: number;

    @Column('bigint', { name: 'doc_id', nullable: false })
    docId: number;

    @Column('boolean', { name: 'is_selected', nullable: false, comment: "true=selected, false=not-selected" })
    isSelected: boolean;

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

    @ManyToOne(() => Tickets, (ticket) => ticket.selectedDoc)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @OneToOne(() => TicketDocuments)
    @JoinColumn({ name: 'doc_id', referencedColumnName: 'id' })
    document: TicketDocuments;

}

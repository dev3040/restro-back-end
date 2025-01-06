import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { SelectedDocsMapping } from './selected-docs-mapping.entity';

@Index("ticket_documents_ticket_id", ["ticketId"], {})
@Entity({ name: 'ticket_documents', schema: 'ticket' })
export class TicketDocuments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'ticket_id' })
    ticketId: number;

    @Column('varchar', { name: 'file_name', length: 255 })
    fileName: string;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @Column('varchar', { name: 'file_path', length: 255, nullable: true, comment: "added for temporary use" })
    filePath: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true:deleted, false:not deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_signed', default: false, comment: "true:signed, false:not signed" })
    isSigned: boolean;

    @Column('boolean', { name: 'is_billing_doc', default: false })
    isBillingDoc: boolean;

    @Column('boolean', { name: 'is_billing_doc_delete', default: false })
    isBillingDocDelete: boolean;

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

    @OneToOne(() => SelectedDocsMapping, selectedDocsMapping => selectedDocsMapping.document)
    selectedDocMapping: SelectedDocsMapping;
}
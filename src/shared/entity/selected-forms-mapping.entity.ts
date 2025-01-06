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
import { Tickets } from './tickets.entity';
import { FormsPdf } from './forms-pdf.entity';


@Entity({ name: 'selected_forms_mapping', schema: 'data_entry' })
export class SelectedFormsMapping extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'ticket_id', nullable: false })
    ticketId: number;

    @Column('bigint', { name: 'form_id', nullable: false })
    formId: number;

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

    @ManyToOne(() => Tickets, (ticket) => ticket.selectedForms)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => FormsPdf, (pdf) => pdf.selectedFormsPdf)
    @JoinColumn({ name: "form_id", referencedColumnName: "id" })
    formsPdf: FormsPdf;
}

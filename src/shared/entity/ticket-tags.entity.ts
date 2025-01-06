import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { Tags } from './tags.entity';

@Index("ticket_tags_ticket_id", ["ticketId"], {})
@Index("ticket_tags_tag_id", ["tagId"], {})

@Entity({ name: 'ticket_tags', schema: 'ticket' })
export class TicketTags extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'ticket_id' })
    ticketId: number;

    @Column('int', { name: 'tag_id' })
    tagId: number;

    @Column('boolean', { name: 'is_active', default: true, comment: "true:active, false:deactive" })
    isActive: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @ManyToOne(() => Tags)
    @JoinColumn({ name: "tag_id", referencedColumnName: "id" })
    tag: Tags;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by", referencedColumnName: "id" })
    createdByUser: User;


}
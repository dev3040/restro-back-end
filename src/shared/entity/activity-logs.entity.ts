import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { ActivityLogActionType } from '../enums/activity-action-type.enum';
import { Tickets } from './tickets.entity';
import { CommentMentions } from './comment-mention.entity';
import { DataEntryFormType } from '../enums/form-type.enum';

@Index("activity_logs_ticket_id", ["ticketId"], {})

@Entity({ name: 'activity_logs', schema: 'public' })
export class ActivityLogs extends BaseEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column('int', { name: 'ticket_id', nullable: false })
   ticketId: number;

   @Column("enum", {
      name: "form_type", enum: DataEntryFormType, nullable: true,
      comment: `Basic Info, Vehicle Info, Title Info, Trade In Info, Lessor Info, Lessee Info, Seller Info, Insurance Info, Task - Summary, Basic Info - Summary, Vehicle Info - Summary, Title Info - Summary, Taxes & Fees - Summary, Seller Info - Summary, Buyer Info - Summary, Trade In Info - Summary, Lien Info - Summary, Billing Info - Summary`
   })
   formType: DataEntryFormType | null;

   @Column('varchar', { name: 'field_name', length: 255, nullable: true })
   fieldName: string | null;

   @Column("enum", {
      name: "action_type", enum: ActivityLogActionType, nullable: false,
      comment: "ticket_creation, ticket_data_update, ticket_data_add, ticket_data_remove, auto_update"
   })
   actionType: ActivityLogActionType;

   @Column('text', { name: 'new_data', nullable: true })
   newData: string | null;

   @Column('text', { name: 'old_data', nullable: true })
   oldData: string | null;

   @Column("int", { name: "user_id", nullable: true })
   userId: number | null;

   @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
   createdAt: Date;

   @ManyToOne(() => User)
   @JoinColumn({ name: "user_id", referencedColumnName: "id" })
   createdByUser: User;

   @ManyToOne(() => Tickets)
   @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
   ticket: Tickets;

   @OneToMany(() => CommentMentions, (a) => a.comment)
   commentMention: CommentMentions[];
}



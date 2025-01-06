import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { InsuranceType } from '../enums/insurance-info.enum';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';

@Index("insurance_info_ticket_id", ["ticketId"], {})

@Entity({ name: 'insurance_info', schema: 'data_entry' })
export class InsuranceInfo extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column('int', { name: 'ticket_id' })
  ticketId: number;

  @Column('enum', { enum: InsuranceType, nullable: true, comment: "ga_insurance_on_file,binder,fleet" })
  type: InsuranceType;

  @Column('date', { nullable: true, name: 'expiration_date' })
  expirationDate: Date;

  @Column('varchar', { length: 250, nullable: true, name: 'company_name' })
  companyName: string;

  @Column('date', { nullable: true, name: 'effective_date' })
  effectiveDate: Date;

  @Column('varchar', { nullable: true, name: 'policy_number', length: 30 })
  policyNumber: number;

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

  @ManyToOne(() => User, (user) => user.departmentCreatedBy)
  @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
  createdByUser: User

  @ManyToOne(() => User, (user) => user.departmentCreatedBy)
  @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
  updatedByUser: User

  @ManyToOne(() => Tickets)
  @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
  ticket: Tickets;

}

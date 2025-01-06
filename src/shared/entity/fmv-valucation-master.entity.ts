import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn, BaseEntity, OneToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { VinInfo } from './vin-info.entity';
import { FmvMasterDocuments } from './fmv-master-documents.entity';
import { Tickets } from './tickets.entity';

@Index("fmv_valucation_master_vin_id", ["vinId"], {})
@Entity({ schema: 'master', name: 'fmv_valucation_master' })
export class FMVValucationMaster extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'vin_id', nullable: true })
  vinId: string;

  @Column({ name: 'vin_first_half', nullable: true, length: 10 })
  vinFirstHalf: string;

  @Column({ name: 'year', nullable: true, type: 'int' })
  year: number;

  @Column('int', { name: 'effective_year', nullable: true })
  effectiveYear: number;

  @Column({ name: 'price', precision: 10, scale: 2, nullable: true, type: 'decimal' })
  price: string;

  @Column({ name: 'value_type', nullable: true, length: 15 })
  valueType: string;

  @Column({ name: 'source', nullable: true, length: 15 })
  source: string;

  @Column({ name: 'date_entered', nullable: true, type: 'date' })
  dateEntered: Date;

  @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
  isDeleted: boolean;

  @Column('boolean', { name: 'is_master', default: false })
  isMaster: boolean;

  @Column('varchar', { name: 'series', length: 100, nullable: true })
  series: string;

  @Column("int", { name: "ticket_id", nullable: true })
  ticketId: number;

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

  @ManyToOne(() => VinInfo)
  @JoinColumn({ name: "vin_id", referencedColumnName: "id" })
  vinInfo: VinInfo;

  @OneToOne(() => FmvMasterDocuments, (d) => d.fmvMaster)
  document: FmvMasterDocuments;

  @ManyToOne(() => Tickets, (ticket) => ticket.fmvMasters)
  @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
  ticket: Tickets;
}

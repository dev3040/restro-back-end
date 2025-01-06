import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TavtForm } from './tavt-form.entity';
import { TavtTaxableMaster } from './tavt-taxable-master.entity';

@Entity({ name: "tavt_other_fees", schema: "data_entry" })
export class TavtOtherFees extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'form_id' })
  formId: number;

  @Column('int', { name: 'other_fees_id' })
  otherFeesId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price', nullable: true })
  price: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt: Date;

  @Column({ type: 'bigint', name: 'created_by', nullable: true })
  createdBy: number | null;

  @Column({ type: 'bigint', name: 'updated_by', nullable: true })
  updatedBy: number;

  @ManyToOne(() => TavtForm)
  @JoinColumn({ name: "form_id", referencedColumnName: "id" })
  tavtForm: TavtForm;

  @ManyToOne(() => TavtTaxableMaster)
  @JoinColumn({ name: "other_fees_id", referencedColumnName: "id" })
  taxableMaster: TavtTaxableMaster;

  @Column("boolean", { name: 'is_deleted', default: false })
  isDeleted: boolean;

}

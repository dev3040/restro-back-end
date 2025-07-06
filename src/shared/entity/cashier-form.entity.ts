import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Branches } from './branches.entity';

@Entity('cashier_form')
export class CashierForm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'generated_date' })
  generated_date: Date;

  @Column({ type: 'json', name: 'data' })
  data: any;

  @Column({ type: 'boolean', name: 'is_half_day', default: false })
  isHalfDay: boolean;

  @Column({ type: 'int', name: 'branch_id' })
  branchId: number;


  @ManyToOne(() => Branches, branch => branch.id)
  @JoinColumn({ name: 'branch_id' })
  branch: Branches;
}

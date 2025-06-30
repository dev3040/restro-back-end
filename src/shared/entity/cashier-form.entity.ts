import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from 'typeorm';

@Entity('cashier_form')
export class CashierForm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'generated_date' })
  generated_date: Date;

  @Column({ type: 'json', name: 'data' })
  data: any;
}

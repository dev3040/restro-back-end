import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { TransactionTypes } from './transaction-types.entity';

@Entity({ name: 'county_transaction_works', schema: 'county' })
export class CountyTransactionWorks extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'county_id' })
  countyId: number;

  @Column({ name: 'check_count', nullable: true, type: 'int' })
  checkCount: number;

  @Column({ name: 'transaction_type_id', type: 'int', nullable: true })
  transactionTypeId: number | null;

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

  @ManyToOne(() => User)
  @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
  createdByUser: User

  @ManyToOne(() => User)
  @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
  updatedByUser: User

  @ManyToOne(() => TitleCounties)
  @JoinColumn([{ name: "county_id", referencedColumnName: "id" }])
  county: TitleCounties

  @ManyToOne(() => TransactionTypes)
  @JoinColumn({ name: "transaction_type_id", referencedColumnName: "id" })
  transactionType: TransactionTypes;

}

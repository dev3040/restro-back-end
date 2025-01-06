import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { CountyMilage } from './county-milage.entity';

@Entity({ name: 'yearly_rates', schema: 'county' })
export class YearlyRates extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'milage_id' })
  milageId: number;

  @Column({ name: 'year', type: 'varchar', length: 4, nullable: true })
  year?: string;

  @Column({ name: 'mill_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  millRate: string;

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

  @ManyToOne(() => CountyMilage)
  @JoinColumn([{ name: "milage_id", referencedColumnName: "id" }])
  countyMilage: CountyMilage

}

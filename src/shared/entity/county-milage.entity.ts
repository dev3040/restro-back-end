import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { YearlyRates } from './county-yearly-rate.entity';
import { BatchPrepMapping } from './batch-prep-mapping.entity';
import { Batches } from './batch.entity';

@Entity({ name: 'county_milage', schema: 'county' })
export class CountyMilage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'county_id' })
  countyId: number;

  @Column({ name: 'district_name', type: 'varchar', length: 100, nullable: true })
  districtName?: string;

  @Column("int", { name: "tax_district", nullable: true })
  taxDistrict: number;

  @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=inactive" })
  isActive: boolean;

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

  @OneToMany(() => YearlyRates, (rate) => rate.countyMilage)
  yearlyRates: YearlyRates[];

  @OneToMany(() => BatchPrepMapping, (batchPrep) => batchPrep.city)
  batchPrepMapping: BatchPrepMapping[];

  @OneToMany(() => Batches, (batch) => batch.countyMilage)
  batch: Batches[];

}

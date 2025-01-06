import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { CountyProcessingTypes, WorksType } from '../enums/county-location.enum';
import { CountyMilage } from './county-milage.entity';

@Entity({ name: 'county_processing', schema: 'county' })
export class CountyProcessing extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'county_id' })
  countyId: number;

  @Column({ name: 'city_id', nullable: true })
  cityId: number;

  @Column({ name: 'type', type: 'enum', enum: CountyProcessingTypes, nullable: true, comment: "WALK:1,DROP:2,MAIL:3" })
  type: CountyProcessingTypes | null;

  @Column({ name: 'works_type', type: 'enum', enum: WorksType, nullable: true, comment: "TITLE_OR_RENEWAL:1,TITLE_AND_RENEWAL:2,COMBINED:3" })
  worksType: WorksType | null;

  @Column({ name: 'renewal_works', nullable: true, type: 'int' })
  renewalWorks: number;

  @Column({ name: 'title_works', nullable: true, type: 'int' })
  titleWorks: number;

  @Column({ name: 'work_rounds', nullable: true, type: 'varchar', length: 10 })
  workRounds: number;

  @Column({ name: 'notes', nullable: true, type: 'text' })
  notes: number;

  @Column({ name: 'drop_notes', nullable: true, type: 'text' })
  dropNotes: number;

  @Column("boolean", { name: "is_transaction_per_work", default: false })
  isTransactionPerWork: boolean;

  @Column("boolean", { name: "is_duplicate_round", default: false })
  isDuplicateRound: boolean;

  @Column({ name: 'check_count', nullable: true, type: 'int' })
  checkCount: number;

  @Column({ name: 'title_or_renewal_total', nullable: true, type: 'int' })
  titleOrRenewalTotal: number;


  //drop rules

  @Column({ name: 'drop_renewal_works', nullable: true, type: 'int' })
  dropRenewalWorks: number;

  @Column({ name: 'drop_title_or_renewal_total', nullable: true, type: 'int' })
  dropTitleOrRenewalTotal: number;

  @Column("boolean", { name: "is_min", default: true })
  isMin: boolean;

  @Column({ name: 'drop_title_works', nullable: true, type: 'int' })
  dropTitleWorks: number;

  @Column({ name: 'drop_work_rounds', nullable: true, type: 'varchar', length: 10 })
  dropWorkRounds: number;

  @Column({ name: 'drop_works_type', type: 'enum', enum: WorksType, nullable: true, comment: "TITLE_OR_RENEWAL:1,TITLE_AND_RENEWAL:2" })
  dropWorksType: WorksType | null;

  @Column("boolean", { name: "is_drop_duplicate_round", default: false })
  isDropDuplicateRound: boolean;

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

  @ManyToOne(() => CountyMilage)
  @JoinColumn([{ name: "city_id", referencedColumnName: "id" }])
  city: CountyMilage

}

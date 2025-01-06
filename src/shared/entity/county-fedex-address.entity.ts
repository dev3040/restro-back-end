import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, AfterLoad } from 'typeorm';
import { User } from './user.entity';
import { CountyProfile } from './county-profile.entity';
import { FedexServiceMaster } from './fedex-service-master.entity';

@Entity({ name: 'county_fedex_address', schema: 'county' })
export class CountyFedexAddress extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'profile_id' })
  profileId: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName?: string;

  @Column({ name: 'company_name', type: 'varchar', length: 100, nullable: true })
  companyName?: string;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ name: 'location', type: 'text', nullable: true })
  location?: string;

  @Column('int', { name: "service_type_id", nullable: true })
  serviceTypeId: number;

  @Column("boolean", { name: "is_deleted", default: false })
  isDeleted: boolean;

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
  updatedByUser: User;

  @ManyToOne(() => CountyProfile)
  @JoinColumn({ name: "profile_id", referencedColumnName: "id" })
  countyProfile: CountyProfile;

  @ManyToOne(() => FedexServiceMaster)
  @JoinColumn([{ name: "service_type_id", referencedColumnName: "id" }])
  fedexServiceMaster: User

  @AfterLoad()
  parsePhysicalAddress() {
    if (this.location) {
      this.location = JSON.parse(this.location);
    }
  }
}

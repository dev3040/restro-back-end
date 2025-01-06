import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, AfterLoad, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { CountyMainLocation } from '../enums/county-location.enum';
import { CountyFedexAddress } from './county-fedex-address.entity';

@Entity({ name: 'county_profile', schema: 'county' })
export class CountyProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'county_id' })
  countyId: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ name: 'role', type: 'varchar', length: 100, nullable: true })
  role?: string;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ name: 'email', type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'physical_address', type: 'text', nullable: true })
  physicalAddress?: string;

  @Column({ name: 'mailing_address', type: 'text', nullable: true })
  mailingAddress?: string;

  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column('enum', { enum: CountyMainLocation, nullable: true, comment: "PHYSICAL_ADDRESS = 1,  MAILING_ADDRESS = 2, SHIPPING_ADDRESS = 3" })
  mainLocation: CountyMainLocation;

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

  @AfterLoad()
  parsePhysicalAddress() {
    if (this.physicalAddress) {
      this.physicalAddress = JSON.parse(this.physicalAddress);
    }
  }

  @AfterLoad()
  parseMailingAddress() {
    if (this.mailingAddress) {
      this.mailingAddress = JSON.parse(this.mailingAddress);
    }
  }

  @AfterLoad()
  parseShippingAddress() {
    if (this.shippingAddress) {
      this.shippingAddress = JSON.parse(this.shippingAddress);
    }
  }

  @OneToOne(() => CountyFedexAddress, (d) => d.countyProfile)
  fedExData: CountyFedexAddress;
}

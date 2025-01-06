import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';

@Index("county_contacts_name", ["name"], {})
@Index("contacts_county_id", ["countyId"], {})

@Entity({ name: 'county_contacts', schema: 'county' })
export class CountyContacts extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'county_id' })
    countyId: number;

    @Column('varchar', { name: 'title', length: 100, nullable: true })
    title: string;

    @Column('varchar', { name: 'name', length: 100, nullable: false })
    name: string;

    @Column('varchar', { name: 'email', length: 100, nullable: true })
    email: string | null;

    @Column('varchar', { name: 'phone', length: 30, nullable: true })
    phone: string | null;

    @Column('text', { name: 'address', nullable: true })
    address: string | null;

    @Column('text', { name: 'notes', nullable: true })
    notes: string | null;

    @Column("boolean", { name: "is_primary", default: false, comment: "true=primary, false=not primary" })
    isPrimary: boolean;

    @Column("boolean", { name: "is_active", default: true, comment: "true=active, false=deactive" })
    isActive: boolean;

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
    updatedByUser: User

    @ManyToOne(() => TitleCounties)
    @JoinColumn([{ name: "county_id", referencedColumnName: "id" }])
    county: TitleCounties

}

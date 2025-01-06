import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';


@Entity({ name: 'county_links', schema: 'county' })
export class CountyLinks extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { name: 'county_id', nullable: false })
    countyId: number;

    @Column('text', { name: 'link_url', nullable: false })
    linkUrl: string;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @Column("boolean", { name: "is_deleted", default: false, nullable: false, comment: "true=deleted, false=not deleted" })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { PlateMaster } from './plate-master.entity';
import { TitleCounties } from './title-counties.entity';

@Entity({ name: 'county_special_forms', schema: 'master' })
export class CountySpecialForms extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "plate_id", nullable: true })
    plateId: number;

    @Column("int", { name: "county_id", nullable: true })
    countyId: number;

    @Column({ name: 'form_name', type: 'varchar', length: 50 })
    formName: string;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => PlateMaster)
    @JoinColumn({ name: "plate_id", referencedColumnName: "id" })
    countyForms: PlateMaster;

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

}

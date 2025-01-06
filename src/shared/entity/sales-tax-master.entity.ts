import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TitleCounties } from './title-counties.entity';
import { CountyMilage } from './county-milage.entity';

@Entity({ name: 'sales_tax_master', schema: 'master' })
@Unique(['countyId', 'cityId', 'effectiveDate'])
export class SalesTaxMaster extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'county_id' })
    countyId: number;

    @Column({ type: 'int', name: 'city_id', nullable: true })
    cityId?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    rate: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'effective_date', type: 'date', nullable: true })
    effectiveDate?: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'bigint', nullable: true })
    updatedBy?: number;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    createdBy: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

    @ManyToOne(() => CountyMilage)
    @JoinColumn({ name: "city_id", referencedColumnName: "id" })
    city: CountyMilage;

}

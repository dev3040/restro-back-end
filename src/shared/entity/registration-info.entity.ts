import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn, AfterLoad, Index } from 'typeorm';
import { Tickets } from './tickets.entity';
import { PlateMaster } from './plate-master.entity';

@Index("registration_info_ticket_id", ["ticketId"], {})
@Entity({ name: 'registration_info', schema: "data_entry" })
export class RegistrationInfo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'ticket_id', type: 'int', nullable: true })
    ticketId: number;

    @Column({ name: 'plate_type_id', type: 'int', nullable: true })
    plateTypeId: number;

    @Column({ name: 'plate_transfer', default: false })
    plateTransfer: boolean;

    @Column({ name: 'plate_number', type: 'varchar', length: 30, nullable: true })
    plateNumber: string;

    @Column({ name: 'expiration_date', type: 'date', nullable: true })
    expirationDate: string;

    @Column({ name: 'gvw', type: 'varchar', length: 100, nullable: true })
    gvw: string;

    @Column("varchar", { name: "type", length: 50, nullable: true })
    type: string;

    @Column("varchar", { name: "primary_fuel_type", length: 100, nullable: true })
    primaryFuelType: string;

    @Column("varchar", { name: "secondary_fuel_type", length: 100, nullable: true })
    secondaryFuelType: string;

    @Column({ name: 'veteran_exempt', default: false })
    veteranExempt: boolean;

    @Column({ name: 'initial_total_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
    initialTotalCost: string;

    @Column({ name: 'emission_verified', type: 'boolean', nullable: true })
    emissionVerified: boolean;

    @Column({ name: 'is_renew_two_years', default: false })
    isRenewTwoYears: boolean;

    @Column({ name: 'is_highway_impact_50', default: false })
    isHighwayImpact50: boolean;

    @Column({ name: 'is_highway_impact_100', default: false })
    isHighwayImpact100: boolean;

    @Column({ name: 'is_alternative_fuel_fee', default: false })
    isAlternativeFuelFee: boolean;

    @Column({ name: 'is_renew_two_years_reg_exp', default: false })
    isRenewTwoYearsRegExp: boolean;

    @Column({ name: 'is_for_hire', default: false })
    isForHire: boolean;

    @Column({ name: 'is2290', default: false })
    is2290: boolean;

    @Column({ name: 'line_2209', type: 'int', nullable: true })
    line2209: number;

    @Column({ name: 'mailing_address', type: 'text', nullable: true })
    mailingAddress: string;

    @Column({ name: 'cost_calc', type: 'text', nullable: true })
    costCalc: string | null;

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
    createdBy: number;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => PlateMaster)
    @JoinColumn({ name: "plate_type_id", referencedColumnName: "id" })
    plate: PlateMaster;

    @AfterLoad()
    parseBrands() {
        if (this.costCalc) {
            this.costCalc = JSON.parse(this.costCalc);
        }
    }
}
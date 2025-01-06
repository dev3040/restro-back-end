import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { User } from "./user.entity";
import { VehicleUsageType } from "../enums/vehicle-usage-type";
import { Tickets } from "./tickets.entity";
import { FMVValucationMaster } from "./fmv-valucation-master.entity";
import { ColorMaster } from "./color-master.entity";
import { VinMaster } from "./vin-master.entity";

@Index("vin_info_vin_number", ["vinNumber"], {})
@Entity({ name: "vin_info", schema: "master" })
export class VinInfo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: "vin_master_id", nullable: true })
    vinMasterId: number;

    @Column("varchar", { name: "vin_number", length: 100 })
    vinNumber: string;

    @Column("int", { name: "year", nullable: true })
    year: number;

    @Column("varchar", { name: "model", length: 100, nullable: true })
    model: string;

    @Column("varchar", { name: "product_class", length: 100, nullable: true })
    productClass: string;

    @Column("varchar", { name: "body_style", length: 50, nullable: true })
    bodyStyle: string;

    @Column("varchar", { name: "gvwr", length: 100, nullable: true })
    gvwr: string;

    @Column("varchar", { name: "gvw", length: 100, nullable: true })
    gvw: string;

    @Column("int", { name: "primary_color_id", nullable: true })
    primaryColorId: number;

    @Column("int", { name: "secondary_color_id", nullable: true })
    secondaryColorId: number;

    @Column("int", { name: "cylinders", nullable: true })
    cylinders: number;

    @Column("varchar", { name: "primary_fuel_type", length: 100, nullable: true })
    primaryFuelType: string;

    @Column("varchar", { name: "secondary_fuel_type", length: 100, nullable: true })
    secondaryFuelType: string;

    @Column("varchar", { name: "engine_type", length: 100, nullable: true })
    engineType: string;

    @Column("varchar", { name: "make", length: 100, nullable: true })
    make: string;

    @Column("int", { name: "no_of_doors", nullable: true })
    noOfDoors: number;

    @Column("varchar", { name: "shipping_weight", length: 100, nullable: true })
    shippingWeight: string;

    @Column("enum", { name: "vehicle_use", enum: VehicleUsageType, nullable: true, comment: "commercials,private" })
    vehicleUse: VehicleUsageType;

    @Column("varchar", { name: "shipping_info", length: 50, nullable: true })
    shippingInfo: string;

    @Column("varchar", { name: "type", length: 50, nullable: true })
    type: string;

    @Column('boolean', { name: 'emissions', default: false, nullable: true })
    emissions: boolean;

    @Column('boolean', { name: 'is_active', default: true, comment: "true=> active,  false=> deactive" })
    isActive: boolean;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'hide_default_error', default: false, comment: "true: hide,  false: show" })
    hideDefaultError: boolean;


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
    @JoinColumn({ name: "created_by", referencedColumnName: "id" })
    createdByUser: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;

    @OneToMany(() => Tickets, (d) => d.vinInfo)
    vinTickets: Tickets[];

    @OneToMany(() => FMVValucationMaster, (d) => d.vinInfo)
    fmvMasters: FMVValucationMaster[];

    @ManyToOne(() => ColorMaster)
    @JoinColumn({ name: "primary_color_id", referencedColumnName: "id" })
    primaryColor: ColorMaster;

    @ManyToOne(() => ColorMaster)
    @JoinColumn({ name: "secondary_color_id", referencedColumnName: "id" })
    secondaryColor: ColorMaster;

    @ManyToOne(() => VinMaster)
    @JoinColumn({ name: "vin_master_id", referencedColumnName: "id" })
    vinMaster: VinMaster;

}

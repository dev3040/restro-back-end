import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { User } from './user.entity';
import { Tickets } from './tickets.entity';
import { LienMaster } from './lien-master.entity';
import { IdOptions } from '../enums/lien-info.enum';

@Index("lien_info_ticket_id", ["ticketId"], {})

@Entity({ name: 'lien_info', schema: 'data_entry' })
export class LienInfo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'ticket_id' })
    ticketId: number;

    @Column('bigint', { name: 'lien_id', nullable: true })
    lienId: number;

    @Column('enum', { name: 'id_option', nullable: true, enum: IdOptions })
    idOption: string;

    @Column('varchar', { length: 12, nullable: true, name: 'license_number' })
    licenseNumber: string;
    
    @Column({ name: 'holder_name', type: 'varchar', nullable: true, length: 200 })
    holderName: string;

    @Column({ type: "varchar", name: "lien_holder_id", nullable: true, length: 50 })
    lienHolderId: string;

    @Column('varchar', { length: 15, nullable: true, name: 'first_name' })
    firstName: string;

    @Column('varchar', { length: 15, nullable: true, name: 'middle_name' })
    middleName: string;

    @Column('varchar', { length: 15, nullable: true, name: 'last_name' })
    lastName: string;

    @Column('varchar', { length: 8, nullable: true, name: 'suffix' })
    suffix: string;

    @Column('boolean', { name: 'is_elt', default: false })
    isElt: boolean;

    @Column('boolean', { name: 'is_individual', default: false })
    isIndividual: boolean;

    @Column("text", { nullable: true })
    address: string | null;

    @Column('boolean', { name: 'is_lien_checked', default: false })
    isLienChecked: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false, comment: "true=deleted, false=not-deleted" })
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

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => LienMaster)
    @JoinColumn({ name: "lien_id", referencedColumnName: "id" })
    lien: LienMaster;
}

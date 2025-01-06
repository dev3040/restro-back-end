import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Tickets } from "./tickets.entity";
import { FMVValucationMaster } from "./fmv-valucation-master.entity";

@Entity({ name: 'fmv_master_documents', schema: 'master' })
export class FmvMasterDocuments extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { name: 'fmv_id' })
    fmvId: number;

    @Column("int", { name: 'ticket_id', nullable: true })
    ticketId: number;

    @Column("varchar", { name: 'file_name' })
    fileName: string;

    @Column('varchar', { name: 'file_path', nullable: true, comment: "added for temporary use" })
    filePath: string;

    @Column("boolean", { name: 'is_deleted', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', nullable: true })
    createdAt: Date;

    @Column("int", { name: 'created_by' })
    createdBy: number;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt: Date;

    @Column("int", { name: 'updated_by', nullable: true })
    updatedBy: number;

    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User


    @ManyToOne(() => User, (user) => user.departmentCreatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => FMVValucationMaster)
    @JoinColumn({ name: "fmv_id", referencedColumnName: "id" })
    fmvMaster: FMVValucationMaster;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;
}
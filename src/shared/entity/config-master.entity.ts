import { Entity, Column, BaseEntity, Unique, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'config', schema: 'master' })
@Unique(['variableName'])
export class ConfigMaster extends BaseEntity {

    @PrimaryGeneratedColumn({ type: "integer", name: "id" })
    id: number;

    @Column('varchar', { name: 'variable_name', nullable: false, length: 100 })
    variableName: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'value', nullable: true })
    value: number;

    @Column("boolean", { name: "is_deleted", default: false, comment: "true=deleted, true=not deleted" })
    isDeleted: boolean;

    @Column("boolean", { name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

}
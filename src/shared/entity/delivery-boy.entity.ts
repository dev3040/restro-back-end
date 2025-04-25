import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Index("delivery_boys_emp_id", ["empId"], {})
@Entity({ name: 'delivery_boys', schema: 'master' })
export class DeliveryBoy extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'emp_id', length: 50, nullable: false })
    empId: string;

    @Column('varchar', { name: 'name', length: 150, nullable: false })
    name: string;

    @Column('varchar', { name: 'phone', length: 20, nullable: false })
    phone: string;

    @Column("boolean", { name: "is_active", nullable: false, default: true })
    isActive: boolean;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        name: "updated_at"
    })
    updatedAt: Date;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;
}

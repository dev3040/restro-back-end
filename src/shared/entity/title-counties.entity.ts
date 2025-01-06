import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TitleStates } from './title-states.entity';
import { User } from './user.entity';

@Entity({ name: 'title_counties', schema: 'master' })
export class TitleCounties extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'state_id', type: 'int' })
    stateId: number;

    @Column({ name: 'name', type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'code', type: 'varchar', length: 15, nullable: true })
    code: string;

    @Column({ name: 'county_code', type: 'varchar', length: 15, nullable: true })
    countyCode: string;

    @Column('boolean', { name: 'is_deleted', default: false, comment: "true=deleted, false=not-deleted" })
    isDeleted: boolean;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => TitleStates)
    @JoinColumn({ name: "state_id", referencedColumnName: "id" })
    state: TitleStates;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number | null;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt: Date | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;

    @ManyToOne(() => User)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User
}

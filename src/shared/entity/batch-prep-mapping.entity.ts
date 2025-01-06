import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { TitleCounties } from './title-counties.entity';
import { Tickets } from './tickets.entity';
import { Batches } from './batch.entity';
import { CountyMilage } from './county-milage.entity';

@Index("batch_prep_county_id", ["countyId"], {})
@Index("batch_prep_batch_id", ["batchId"], {})

@Entity({ name: 'batch_prep_mapping', schema: 'batch_prep' })
export class BatchPrepMapping extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { name: 'ticket_id', nullable: true })
    ticketId: number;

    @Column('bigint', { name: 'county_id', nullable: true })
    countyId: number;

    @Column('bigint', { name: 'batch_id', nullable: true })
    batchId: number;

    @Column('bigint', { name: 'city_id', nullable: true })
    cityId: number;

    @CreateDateColumn({
        type: "timestamp with time zone",
        name: "created_at"
    })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: true })
    createdBy: number;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number;

    @ManyToOne(() => User, (user) => user.batchPrepCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
    updatedByUser: User;

    @ManyToOne(() => TitleCounties)
    @JoinColumn({ name: "county_id", referencedColumnName: "id" })
    county: TitleCounties;

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => Batches)
    @JoinColumn({ name: "batch_id", referencedColumnName: "id" })
    batch: Batches;

    @ManyToOne(() => CountyMilage)
    @JoinColumn([{ name: "city_id", referencedColumnName: "id" }])
    city: CountyMilage
}

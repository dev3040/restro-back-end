import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, AfterLoad, Index } from 'typeorm';
import { User } from './user.entity';
import { OdometerCode } from '../enums/odometer-code.enum';
import { OdometerUnit } from '../enums/odometer-unit.enum';
import { Tickets } from './tickets.entity';
import { TitleStates } from './title-states.entity';

@Index("title_info_ticket_id", ["ticketId"], {})
@Entity({ name: 'title_info', schema: 'data_entry' })
export class TitleInfo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'ticket_id', type: 'int', nullable: false })
    ticketId: number;

    @Column({ name: 'state_id', type: 'int', nullable: true })
    stateId: number | null;

    @Column({ name: 'current_title', type: 'varchar', length: 15, nullable: true })
    currentTitle: string | null;

    @Column({ name: 'is_new', type: 'boolean', nullable: false, default: true })
    isNew: boolean;

    @Column({ name: 'brands', type: 'text', nullable: true })
    brands: string | null;

    @Column({ name: 'odometer_code', type: 'enum', enum: OdometerCode, nullable: true, comment: "actual,  exceeds_mechanical_limit, not_actual_milage, exempt" })
    odometerCode: OdometerCode | null;

    @Column({ name: 'odometer_reading', type: 'varchar', length: 15, nullable: true })
    odometerReading: string | null;

    @Column({ name: 'odometer_unit', type: 'enum', enum: OdometerUnit, nullable: true, comment: "miles" })
    odometerUnit: OdometerUnit | null;

    @Column({ name: 'odometer_date', type: 'date', nullable: true })
    odometerDate: Date | null;

    @CreateDateColumn({ type: "timestamp with time zone", name: "created_at" })
    createdAt: Date;

    @Column("int", { name: "created_by", nullable: false })
    createdBy: number;

    @UpdateDateColumn({ type: "timestamp with time zone", name: "updated_at" })
    updatedAt: Date | null;

    @Column("int", { name: "updated_by", nullable: true })
    updatedBy: number | null;


    @ManyToOne(() => User, (user) => user.tidTypeCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.tidTypeUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => Tickets)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

    @ManyToOne(() => TitleStates)
    @JoinColumn({ name: "state_id", referencedColumnName: "id" })
    titleState: TitleStates;

    @AfterLoad()
    parseBrands() {
        if (this.brands) {
            this.brands = JSON.parse(this.brands);
        }
    }

}

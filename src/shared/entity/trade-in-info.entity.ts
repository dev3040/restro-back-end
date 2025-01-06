import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Tickets } from './tickets.entity';
import { User } from './user.entity';
import { OdometerCodeEnum } from '../enums/trade-in-info.enum';

@Index("trade_in_info_ticket_id", ["ticketId"], {})
@Entity({ name: "trade_in_info", schema: "data_entry" })
export class TradeInInfo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "vin_number", length: 100, nullable: true })
    vinNumber: string;

    @Column("enum", { name: "odometer_code", nullable: true, enum: OdometerCodeEnum, comment: "actual, exceeds_mechanical_limits,exempt, not_actual_milage" })
    odometerCode: OdometerCodeEnum;

    @Column("varchar", { length: 10, nullable: true })
    lastOdometerReading: string;

    @Column("decimal", { name: "trade_in_allowance", precision: 10, scale: 2, nullable: true })
    tradeInAllowance: string;

    @Column("boolean", { name: "is_deleted", default: false })
    isDeleted: boolean;

    @Column("int", { name: "ticket_id", nullable: false })
    ticketId: number;

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

    @ManyToOne(() => User, (user) => user.tradeInInfoCreatedBy)
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User, (user) => user.tradeInInfoUpdatedBy)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @ManyToOne(() => Tickets, (ticket) => ticket.tradeInInfo)
    @JoinColumn({ name: "ticket_id", referencedColumnName: "id" })
    ticket: Tickets;

}

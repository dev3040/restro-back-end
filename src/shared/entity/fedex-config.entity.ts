import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, AfterLoad } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'fed_ex_config', schema: 'master' })
export class FedExConfig extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'from_shipper', type: 'text', nullable: true })
    fromShipper?: string;

    @Column({ name: 'return_shipper', type: 'text', nullable: true })
    returnShipper?: string;

    @Column({ name: 'return_recipient', type: 'text', nullable: true })
    returnRecipient?: string;

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
    @JoinColumn([{ name: "created_by", referencedColumnName: "id" }])
    createdByUser: User

    @ManyToOne(() => User)
    @JoinColumn([{ name: "updated_by", referencedColumnName: "id" }])
    updatedByUser: User

    @AfterLoad()
    parsePhysicalAddress() {
        if (this.fromShipper) {
            this.fromShipper = JSON.parse(this.fromShipper);
        }
    }

    @AfterLoad()
    parseMailingAddress() {
        if (this.returnShipper) {
            this.returnShipper = JSON.parse(this.returnShipper);
        }
    }

    @AfterLoad()
    recipientAddress() {
        if (this.returnRecipient) {
            this.returnRecipient = JSON.parse(this.returnRecipient);
        }
    }
}

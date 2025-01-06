import { BaseEntity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';


export class BaseModifiableEntity extends BaseEntity {

    @Column({ name: "created_by", nullable: true })
    createdBy: number

    @Column({ name: "updated_by", nullable: true })
    updatedBy: number

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

}

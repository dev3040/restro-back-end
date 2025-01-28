import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ schema: 'master', name: 'designation' })
export class Designation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: 'name', length: 150 })
    name: string;

    @Column("int", { name: "order", nullable: true })
    order: number;
}

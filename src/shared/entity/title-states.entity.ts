import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ schema: 'master', name: 'title_states' })
export class TitleStates extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: 'name', length: 150 })
    name: string;

    @Column("varchar", { name: 'field_name', length: 100, nullable: true })
    fieldName: string;

    @Column("varchar", { name: 'location', length: 50, nullable: true })
    location: string;

    @Column("varchar", { name: 'code', length: 15, nullable: true })
    code: string;

    @Column("text", { name: 'title_format', nullable: true })
    titleFormat: string;

    @Column("int", { name: "order", nullable: true })
    order: number;
}

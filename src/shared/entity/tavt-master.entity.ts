import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tavt_master', schema: 'master' })
export class TavtTaxMaster extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rate', nullable: true })
    rate: string;

    @Column("text", { nullable: true })
    description: string;

    @Column("varchar", { nullable: true, length: 30 })
    slug: string;
}

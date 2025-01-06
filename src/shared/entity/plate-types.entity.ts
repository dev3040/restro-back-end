import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import { CommonConst } from '../constants/common.constant';

@Entity({ name: 'plate_types', schema: 'master' })
export class PlateType extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plate_type', type: 'varchar', length: 150 })
  plateType: string;

  @Column({ name: 'slug', type: 'varchar', length: CommonConst.slugLength, nullable: true })
  slug: string;

  @Column("int", { name: "order", nullable: true })
  order: number;
}

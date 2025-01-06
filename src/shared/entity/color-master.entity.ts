import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: 'color_master', schema: 'master' })
export class ColorMaster extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  colorCode: string;

  @Column({ length: 20 })
  colorName: string;
}
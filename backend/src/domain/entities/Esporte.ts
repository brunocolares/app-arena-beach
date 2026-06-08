import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Quadra } from './Quadra';

@Entity('esportes')
export class Esporte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome_esporte: string;

  @Column({ type: 'varchar', nullable: true })
  imagem_url: string;

  @Column({ type: 'varchar', nullable: true })
  preco_partir: string;

  @CreateDateColumn()
  criado_em: Date;

  @OneToMany(() => Quadra, (quadra) => quadra.esporte)
  quadras: Quadra[];
}

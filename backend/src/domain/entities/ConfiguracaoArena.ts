import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracao_arena')
export class ConfiguracaoArena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, default: 'Arena Beach' })
  nome: string;

  @Column({ type: 'varchar', nullable: true })
  endereco: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', length: 5, default: '07:00' })
  hora_abertura: string;

  @Column({ type: 'varchar', length: 5, default: '22:00' })
  hora_fechamento: string;
}

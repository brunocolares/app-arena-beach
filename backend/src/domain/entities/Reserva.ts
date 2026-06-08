import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Usuario } from './Usuario';
import { Quadra } from './Quadra';

export type TipoReserva = 'reserva' | 'bloqueio';
export type StatusReserva = 'ativa' | 'cancelada' | 'concluida';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  usuario_id: string;

  @Column({ type: 'varchar' })
  quadra_id: string;

  @Column({ type: 'varchar', length: 10 })
  data_reserva: string; // formato: YYYY-MM-DD

  @Column({ type: 'varchar', length: 5 })
  hora_inicio: string; // formato: HH:MM

  @Column({ type: 'varchar', length: 5 })
  hora_fim: string; // formato: HH:MM

  @Column({ type: 'varchar', length: 20, default: 'reserva' })
  tipo: TipoReserva;

  @Column({ type: 'varchar', length: 20, default: 'ativa' })
  status: StatusReserva;

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Quadra, (quadra) => quadra.reservas)
  @JoinColumn({ name: 'quadra_id' })
  quadra: Quadra;
}

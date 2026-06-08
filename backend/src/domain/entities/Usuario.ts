import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, BeforeInsert
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Reserva } from './Reserva';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  senha: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'boolean', default: false })
  is_admin: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @OneToMany(() => Reserva, (reserva) => reserva.usuario)
  reservas: Reserva[];

  @BeforeInsert()
  async hashSenha() {
    this.senha = await bcrypt.hash(this.senha, 10);
  }

  async verificarSenha(senhaPlana: string): Promise<boolean> {
    return bcrypt.compare(senhaPlana, this.senha);
  }
}

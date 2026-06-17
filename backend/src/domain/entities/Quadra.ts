import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Esporte } from "./Esporte";
import { Reserva } from "./Reserva";

@Entity("quadras")
export class Quadra {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  esporte_id: string;

  @Column({ type: "varchar", length: 100 })
  nome_quadra: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  preco_hora: number;

  @Column({ type: "text", nullable: true })
  fotos_json: string; // JSON array de URLs

  @Column({ type: "text", nullable: true })
  diferenciais_json: string; // JSON array de strings

  @Column({ type: "text", nullable: true })
  esportes_ids_json: string; // JSON array de esporte IDs

  @Column({ type: "boolean", default: true })
  ativa: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(() => Esporte, (esporte) => esporte.quadras)
  @JoinColumn({ name: "esporte_id" })
  esporte: Esporte;

  @OneToMany(() => Reserva, (reserva) => reserva.quadra)
  reservas: Reserva[];

  get fotos(): string[] {
    try {
      return JSON.parse(this.fotos_json || "[]");
    } catch {
      return [];
    }
  }

  set fotos(val: string[]) {
    this.fotos_json = JSON.stringify(val || []);
  }

  get diferenciais(): string[] {
    try {
      return JSON.parse(this.diferenciais_json || "[]");
    } catch {
      return [];
    }
  }

  set diferenciais(val: string[]) {
    this.diferenciais_json = JSON.stringify(val || []);
  }

  get esportes_ids(): string[] {
    try {
      return JSON.parse(this.esportes_ids_json || "[]");
    } catch {
      return [];
    }
  }

  set esportes_ids(val: string[]) {
    this.esportes_ids_json = JSON.stringify(val || []);
  }
}

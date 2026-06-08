import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { Esporte } from '../../domain/entities/Esporte';
import { Quadra } from '../../domain/entities/Quadra';
import { Usuario } from '../../domain/entities/Usuario';
import { Reserva } from '../../domain/entities/Reserva';
import { ConfiguracaoArena } from '../../domain/entities/ConfiguracaoArena';

const dbPath = path.resolve(__dirname, '..', '..', '..', 'database', 'arena.sqlite');

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: dbPath,
  autoSave: true,
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [Esporte, Quadra, Usuario, Reserva, ConfiguracaoArena],
  migrations: [],
  subscribers: [],
});

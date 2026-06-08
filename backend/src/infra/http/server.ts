import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from '../database/dataSource';
import { rotas } from './routes/rotas';
import { manipuladorErros } from './middlewares/manipuladorErros';

const app = express();
const PORTA = process.env.PORT || 3333;

// Garantir que a pasta do banco exista
const dbDir = path.resolve(__dirname, '..', '..', '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Middlewares globais
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir imagens estáticas (uploads)
const uploadsDir = path.resolve(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rotas da API
app.use(rotas);

// Rota de health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Manipulador de erros (deve ser o último middleware)
app.use(manipuladorErros);

// Inicializar banco e subir servidor
AppDataSource.initialize()
  .then(() => {
    console.log('🗄️  Banco de dados SQLite conectado com sucesso!');
    app.listen(PORTA, () => {
      console.log(`\n🚀 Servidor Arena Beach rodando na porta ${PORTA}`);
      console.log(`📡 Acesse: http://localhost:${PORTA}`);
      console.log(`🔍 Health: http://localhost:${PORTA}/health`);
      console.log('\n📌 Para popular dados iniciais, execute: npm run seed\n');
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
    process.exit(1);
  });

export { app };

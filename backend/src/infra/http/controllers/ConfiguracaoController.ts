import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/dataSource';
import { ConfiguracaoArena } from '../../../domain/entities/ConfiguracaoArena';

export class ConfiguracaoController {
  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = AppDataSource.getRepository(ConfiguracaoArena);
      let config = await repo.findOne({ where: {} });
      if (!config) {
        config = repo.create({
          nome: 'Arena Beach',
          hora_abertura: '07:00',
          hora_fechamento: '22:00',
        });
        await repo.save(config);
      }
      return res.json(config);
    } catch (err) {
      next(err);
    }
  }

  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, endereco, telefone, hora_abertura, hora_fechamento } = req.body;
      const repo = AppDataSource.getRepository(ConfiguracaoArena);

      let config = await repo.findOne({ where: {} });
      if (!config) {
        config = repo.create({});
      }

      if (nome !== undefined) config.nome = nome;
      if (endereco !== undefined) config.endereco = endereco;
      if (telefone !== undefined) config.telefone = telefone;
      if (hora_abertura !== undefined) config.hora_abertura = hora_abertura;
      if (hora_fechamento !== undefined) config.hora_fechamento = hora_fechamento;

      await repo.save(config);
      return res.json(config);
    } catch (err) {
      next(err);
    }
  }
}

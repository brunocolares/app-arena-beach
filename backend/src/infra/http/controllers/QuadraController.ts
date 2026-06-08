import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/dataSource';
import { Quadra } from '../../../domain/entities/Quadra';
import { Esporte } from '../../../domain/entities/Esporte';
import { ErroNaoEncontrado, ErroValidacao } from '../../../shared/erros/ErrosAplicacao';

function serializarQuadra(q: Quadra) {
  return {
    id: q.id,
    esporte_id: q.esporte_id,
    nome_quadra: q.nome_quadra,
    preco_hora: Number(q.preco_hora),
    fotos: q.fotos,
    diferenciais: q.diferenciais,
    ativa: q.ativa,
    criado_em: q.criado_em,
  };
}

export class QuadraController {
  // GET /quadras?esporte_id=xxx
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { esporte_id } = req.query;
      const repoQuadra = AppDataSource.getRepository(Quadra);

      const filtro: any = {};
      if (esporte_id) filtro.esporte_id = esporte_id;
      // Visitantes veem apenas ativas; admin vê todas
      if (!req.usuarioLogado?.is_admin) filtro.ativa = true;

      const quadras = await repoQuadra.find({
        where: filtro,
        order: { nome_quadra: 'ASC' },
      });

      return res.json(quadras.map(serializarQuadra));
    } catch (err) {
      next(err);
    }
  }

  // GET /quadras/:id
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const repoQuadra = AppDataSource.getRepository(Quadra);
      const quadra = await repoQuadra.findOne({ where: { id } });
      if (!quadra) throw new ErroNaoEncontrado('Quadra');
      return res.json(serializarQuadra(quadra));
    } catch (err) {
      next(err);
    }
  }

  // POST /quadras
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome_quadra, preco_hora, esporte_id, fotos, diferenciais } = req.body;

      if (!nome_quadra || !preco_hora || !esporte_id) {
        return res.status(400).json({ mensagem: 'Nome, preço e esporte são obrigatórios.' });
      }

      const repoEsporte = AppDataSource.getRepository(Esporte);
      const esporteExiste = await repoEsporte.findOne({ where: { id: esporte_id } });
      if (!esporteExiste) throw new ErroNaoEncontrado('Esporte');

      const repoQuadra = AppDataSource.getRepository(Quadra);
      const quadra = repoQuadra.create({
        nome_quadra,
        preco_hora: Number(preco_hora),
        esporte_id,
        fotos_json: JSON.stringify(fotos || []),
        diferenciais_json: JSON.stringify(diferenciais || []),
        ativa: true,
      });

      await repoQuadra.save(quadra);
      return res.status(201).json(serializarQuadra(quadra));
    } catch (err) {
      next(err);
    }
  }

  // PUT /quadras/:id
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nome_quadra, preco_hora, esporte_id, fotos, diferenciais, ativa } = req.body;

      const repoQuadra = AppDataSource.getRepository(Quadra);
      const quadra = await repoQuadra.findOne({ where: { id } });
      if (!quadra) throw new ErroNaoEncontrado('Quadra');

      if (nome_quadra) quadra.nome_quadra = nome_quadra;
      if (preco_hora !== undefined) quadra.preco_hora = Number(preco_hora);
      if (esporte_id) quadra.esporte_id = esporte_id;
      if (fotos !== undefined) quadra.fotos_json = JSON.stringify(fotos);
      if (diferenciais !== undefined) quadra.diferenciais_json = JSON.stringify(diferenciais);
      if (ativa !== undefined) quadra.ativa = ativa;

      await repoQuadra.save(quadra);
      return res.json(serializarQuadra(quadra));
    } catch (err) {
      next(err);
    }
  }

  // PATCH /quadras/:id  (ativar/desativar)
  async alternarAtivacao(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { ativa } = req.body;

      const repoQuadra = AppDataSource.getRepository(Quadra);
      const quadra = await repoQuadra.findOne({ where: { id } });
      if (!quadra) throw new ErroNaoEncontrado('Quadra');

      quadra.ativa = ativa;
      await repoQuadra.save(quadra);
      return res.json(serializarQuadra(quadra));
    } catch (err) {
      next(err);
    }
  }
}

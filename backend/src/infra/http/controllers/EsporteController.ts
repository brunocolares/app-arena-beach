import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../database/dataSource";
import { Esporte } from "../../../domain/entities/Esporte";
import { Quadra } from "../../../domain/entities/Quadra";
import {
  ErroNaoEncontrado,
  ErroConflito,
} from "../../../shared/erros/ErrosAplicacao";
import { Like } from "typeorm";

export class EsporteController {
  // GET /esportes
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const repoEsporte = AppDataSource.getRepository(Esporte);
      const repoQuadra = AppDataSource.getRepository(Quadra);

      const esportes = await repoEsporte.find({
        order: { nome_esporte: "ASC" },
      });

      // Adicionar contagem de quadras por esporte
      const resultado = await Promise.all(
        esportes.map(async (e) => {
          const qtdQuadras = await repoQuadra
            .createQueryBuilder("quadra")
            .where("quadra.ativa = :ativa", { ativa: true })
            .andWhere(
              "(quadra.esporte_id = :esporteId OR quadra.esportes_ids_json LIKE :esporteLike)",
              { esporteId: e.id, esporteLike: `%"${e.id}"%` },
            )
            .getCount();

          return {
            id: e.id,
            nome_esporte: e.nome_esporte,
            imagem_url: e.imagem_url,
            preco_partir: e.preco_partir,
            quadras: qtdQuadras,
          };
        }),
      );

      return res.json(resultado);
    } catch (err) {
      next(err);
    }
  }

  // GET /esportes/:id
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const repoEsporte = AppDataSource.getRepository(Esporte);
      const esporte = await repoEsporte.findOne({ where: { id } });
      if (!esporte) throw new ErroNaoEncontrado("Esporte");
      return res.json(esporte);
    } catch (err) {
      next(err);
    }
  }

  // POST /esportes
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome_esporte, imagem_url, preco_partir } = req.body;
      if (!nome_esporte) {
        return res
          .status(400)
          .json({ mensagem: "Nome do esporte é obrigatório." });
      }

      const repoEsporte = AppDataSource.getRepository(Esporte);
      const esporte = repoEsporte.create({
        nome_esporte,
        imagem_url,
        preco_partir,
      });
      await repoEsporte.save(esporte);

      return res.status(201).json(esporte);
    } catch (err) {
      next(err);
    }
  }

  // PUT /esportes/:id
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nome_esporte, imagem_url, preco_partir } = req.body;

      const repoEsporte = AppDataSource.getRepository(Esporte);
      const esporte = await repoEsporte.findOne({ where: { id } });
      if (!esporte) throw new ErroNaoEncontrado("Esporte");

      if (nome_esporte) esporte.nome_esporte = nome_esporte;
      if (imagem_url !== undefined) esporte.imagem_url = imagem_url;
      if (preco_partir !== undefined) esporte.preco_partir = preco_partir;

      await repoEsporte.save(esporte);
      return res.json(esporte);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /esportes/:id
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const repoEsporte = AppDataSource.getRepository(Esporte);
      const esporte = await repoEsporte.findOne({ where: { id } });
      if (!esporte) throw new ErroNaoEncontrado("Esporte");

      const repoQuadra = AppDataSource.getRepository(Quadra);
      const quadrasAtivas = await repoQuadra
        .createQueryBuilder("quadra")
        .where("quadra.ativa = :ativa", { ativa: true })
        .andWhere(
          "(quadra.esporte_id = :esporteId OR quadra.esportes_ids_json LIKE :esporteLike)",
          { esporteId: id, esporteLike: `%\"${id}\"%` },
        )
        .getCount();

      if (quadrasAtivas > 0) {
        throw new ErroConflito(
          "Não é possível excluir o esporte enquanto houver quadras ativas vinculadas a ele.",
        );
      }

      await repoEsporte.remove(esporte);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

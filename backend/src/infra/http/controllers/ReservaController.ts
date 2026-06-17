import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../database/dataSource";
import { Reserva } from "../../../domain/entities/Reserva";
import { Quadra } from "../../../domain/entities/Quadra";
import { ConfiguracaoArena } from "../../../domain/entities/ConfiguracaoArena";
import {
  ErroConflito,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroValidacao,
} from "../../../shared/erros/ErrosAplicacao";

function gerarSlotsHorario(abertura: string, fechamento: string): string[] {
  const slots: string[] = [];
  const [hA] = abertura.split(":").map(Number);
  const [hF] = fechamento.split(":").map(Number);
  for (let h = hA; h < hF; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

function hojeMais2h(dataReserva: string, horaInicio: string): boolean {
  const agora = new Date();
  const dataHora = new Date(`${dataReserva}T${horaInicio}:00`);
  return dataHora.getTime() > agora.getTime() + 2 * 60 * 60 * 1000;
}

function dataPassada(dataReserva: string, horaInicio: string): boolean {
  const agora = new Date();
  const dataHora = new Date(`${dataReserva}T${horaInicio}:00`);
  return dataHora <= agora;
}

export class ReservaController {
  // GET /horarios-disponiveis?quadra_id=xxx&data=YYYY-MM-DD
  async horariosDisponiveis(req: Request, res: Response, next: NextFunction) {
    try {
      const { quadra_id, data } = req.query as {
        quadra_id: string;
        data: string;
      };
      if (!quadra_id || !data) {
        return res
          .status(400)
          .json({ mensagem: "quadra_id e data são obrigatórios." });
      }

      const repoConfig = AppDataSource.getRepository(ConfiguracaoArena);
      const repoReserva = AppDataSource.getRepository(Reserva);

      const config = await repoConfig.findOne({ where: {} });
      const abertura = config?.hora_abertura || "07:00";
      const fechamento = config?.hora_fechamento || "22:00";

      const todosSlots = gerarSlotsHorario(abertura, fechamento);

      const reservasNoDia = await repoReserva.find({
        where: { quadra_id, data_reserva: data, status: "ativa" },
      });

      const horariosOcupados = new Set(reservasNoDia.map((r) => r.hora_inicio));
      const agora = new Date();

      const slots = todosSlots.map((horario) => {
        const dataHora = new Date(`${data}T${horario}:00`);
        const passado = dataHora <= agora;
        return {
          horario,
          disponivel: !horariosOcupados.has(horario) && !passado,
        };
      });

      return res.json(slots);
    } catch (err) {
      next(err);
    }
  }

  // POST /reservas — Criar reserva
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { quadra_id, data_reserva, hora_inicio, hora_fim } = req.body;
      const usuarioId = req.usuarioLogado!.id;

      if (!quadra_id || !data_reserva || !hora_inicio || !hora_fim) {
        return res
          .status(400)
          .json({ mensagem: "Todos os campos são obrigatórios." });
      }

      // Bloquear retroativos
      if (dataPassada(data_reserva, hora_inicio)) {
        throw new ErroValidacao(
          "Não é possível agendar horários que já passaram.",
        );
      }

      const repoReserva = AppDataSource.getRepository(Reserva);

      // Verificar concorrência (RN02)
      const conflito = await repoReserva.findOne({
        where: {
          quadra_id,
          data_reserva,
          hora_inicio,
          status: "ativa",
        },
      });
      if (conflito) throw new ErroConflito("Este horário já está reservado.");

      const reserva = repoReserva.create({
        usuario_id: usuarioId,
        quadra_id,
        data_reserva,
        hora_inicio,
        hora_fim,
        tipo: "reserva",
        status: "ativa",
      });

      await repoReserva.save(reserva);

      const reservaCompleta = await repoReserva.findOne({
        where: { id: reserva.id },
        relations: ["quadra"],
      });

      return res.status(201).json(reservaCompleta);
    } catch (err) {
      next(err);
    }
  }

  // GET /reservas/minhas — Reservas do usuário logado
  async minhasReservas(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.usuarioLogado!.id;
      const repoReserva = AppDataSource.getRepository(Reserva);

      const reservas = await repoReserva.find({
        where: { usuario_id: usuarioId },
        relations: ["quadra"],
        order: { data_reserva: "DESC", hora_inicio: "DESC" },
      });

      return res.json(reservas);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /reservas/:id — Cancelar (RN03)
  async cancelar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuarioLogado!.id;
      const isAdmin = req.usuarioLogado!.is_admin;

      const repoReserva = AppDataSource.getRepository(Reserva);
      const reserva = await repoReserva.findOne({ where: { id } });
      if (!reserva) throw new ErroNaoEncontrado("Reserva");

      // Apenas o dono ou admin pode cancelar
      if (!isAdmin && reserva.usuario_id !== usuarioId) {
        throw new ErroNaoAutorizado(
          "Você não tem permissão para cancelar esta reserva.",
        );
      }

      // Cancelamento permitido a qualquer momento pelo cliente

      reserva.status = "cancelada";
      await repoReserva.save(reserva);

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // POST /reservas/bloqueio — Admin bloqueia horário
  async criarBloqueio(req: Request, res: Response, next: NextFunction) {
    try {
      const { quadra_id, data, hora_inicio, hora_fim } = req.body;

      if (dataPassada(data, hora_inicio)) {
        throw new ErroValidacao(
          "Não é possível bloquear horários que já passaram.",
        );
      }

      const repoReserva = AppDataSource.getRepository(Reserva);

      const conflito = await repoReserva.findOne({
        where: { quadra_id, data_reserva: data, hora_inicio, status: "ativa" },
      });
      if (conflito)
        throw new ErroConflito("Já existe uma reserva neste horário.");

      const bloqueio = repoReserva.create({
        quadra_id,
        data_reserva: data,
        hora_inicio,
        hora_fim,
        tipo: "bloqueio",
        status: "ativa",
      });

      await repoReserva.save(bloqueio);
      return res.status(201).json(bloqueio);
    } catch (err) {
      next(err);
    }
  }

  // GET /admin/agenda?data=YYYY-MM-DD
  async agendaDiaria(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.query as { data: string };
      if (!data)
        return res.status(400).json({ mensagem: "data é obrigatória." });

      const repoQuadra = AppDataSource.getRepository(Quadra);
      const repoReserva = AppDataSource.getRepository(Reserva);

      const quadras = await repoQuadra.find({ order: { nome_quadra: "ASC" } });
      const reservas = await repoReserva.find({
        where: { data_reserva: data, status: "ativa" },
        relations: ["usuario", "quadra"],
      });

      return res.json({
        quadras: quadras.map((q) => ({
          id: q.id,
          nome_quadra: q.nome_quadra,
          ativa: q.ativa,
        })),
        reservas,
      });
    } catch (err) {
      next(err);
    }
  }
}

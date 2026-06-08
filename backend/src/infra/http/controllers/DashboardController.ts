import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/dataSource';
import { Reserva } from '../../../domain/entities/Reserva';
import { Quadra } from '../../../domain/entities/Quadra';
import { Esporte } from '../../../domain/entities/Esporte';
import { Usuario } from '../../../domain/entities/Usuario';

export class DashboardController {
  // GET /admin/dashboard?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
  async resumo(req: Request, res: Response, next: NextFunction) {
    try {
      const repoReserva = AppDataSource.getRepository(Reserva);
      const repoQuadra = AppDataSource.getRepository(Quadra);
      const repoEsporte = AppDataSource.getRepository(Esporte);
      const repoUsuario = AppDataSource.getRepository(Usuario);

      const hoje = new Date();
      const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
      const dataInicio = (req.query.data_inicio as string) || `${anoMes}-01`;
      const dataFim = (req.query.data_fim as string) || `${anoMes}-31`;
      const dataHoje = hoje.toISOString().split('T')[0];

      // Todas reservas (tipo=reserva, status=ativa ou concluida) no período
      const todasReservas = await repoReserva
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.quadra', 'quadra')
        .leftJoinAndSelect('quadra.esporte', 'esporte')
        .where('r.tipo = :tipo', { tipo: 'reserva' })
        .andWhere('r.status != :cancelada', { cancelada: 'cancelada' })
        .andWhere('r.data_reserva >= :inicio', { inicio: dataInicio })
        .andWhere('r.data_reserva <= :fim', { fim: dataFim })
        .getMany();

      // Reservas de hoje
      const reservasHoje = await repoReserva.find({
        where: { data_reserva: dataHoje, tipo: 'reserva', status: 'ativa' },
        relations: ['quadra'],
      });

      // ─── Faturamento no período ───────────────────────────
      const faturamentoPeriodo = todasReservas.reduce((acc, r) => {
        return acc + Number(r.quadra?.preco_hora || 0);
      }, 0);

      // Faturamento hoje
      const faturamentoHoje = reservasHoje.reduce((acc, r) => {
        return acc + Number(r.quadra?.preco_hora || 0);
      }, 0);

      // ─── Esporte mais escolhido ───────────────────────────
      const contagemEsportes: Record<string, { nome: string; total: number }> = {};
      for (const r of todasReservas) {
        const esporteId = r.quadra?.esporte_id || '';
        const esporteNome = (r.quadra as any)?.esporte?.nome_esporte || 'Desconhecido';
        if (!contagemEsportes[esporteId]) {
          contagemEsportes[esporteId] = { nome: esporteNome, total: 0 };
        }
        contagemEsportes[esporteId].total++;
      }
      const rankingEsportes = Object.values(contagemEsportes)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // ─── Horário mais alugado ─────────────────────────────
      const contagemHorarios: Record<string, number> = {};
      for (const r of todasReservas) {
        contagemHorarios[r.hora_inicio] = (contagemHorarios[r.hora_inicio] || 0) + 1;
      }
      const rankingHorarios = Object.entries(contagemHorarios)
        .map(([horario, total]) => ({ horario, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // ─── Quadra mais alugada ──────────────────────────────
      const contagemQuadras: Record<string, { nome: string; total: number; faturamento: number }> = {};
      for (const r of todasReservas) {
        const qId = r.quadra_id;
        const qNome = r.quadra?.nome_quadra || 'Desconhecida';
        if (!contagemQuadras[qId]) {
          contagemQuadras[qId] = { nome: qNome, total: 0, faturamento: 0 };
        }
        contagemQuadras[qId].total++;
        contagemQuadras[qId].faturamento += Number(r.quadra?.preco_hora || 0);
      }
      const rankingQuadras = Object.values(contagemQuadras)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // ─── Dia da semana mais movimentado ──────────────────
      const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const contagemDias: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (const r of todasReservas) {
        const d = new Date(`${r.data_reserva}T12:00:00`);
        contagemDias[d.getDay()]++;
      }
      const rankingDias = Object.entries(contagemDias)
        .map(([dia, total]) => ({ dia: nomesDias[Number(dia)], total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      // ─── Faturamento por dia (últimos 7 dias) ─────────────
      const ultimos7: { data: string; total: number; faturamento: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - i);
        const dataStr = d.toISOString().split('T')[0];
        const reservasDoDia = todasReservas.filter(r => r.data_reserva === dataStr);
        const fat = reservasDoDia.reduce((acc, r) => acc + Number(r.quadra?.preco_hora || 0), 0);
        const dia = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
        ultimos7.push({ data: dia, total: reservasDoDia.length, faturamento: fat });
      }

      // ─── Totais gerais ────────────────────────────────────
      const totalQuadras = await repoQuadra.count({ where: { ativa: true } });
      const totalEsportes = await repoEsporte.count();
      const totalUsuarios = await repoUsuario.count({ where: { is_admin: false } });
      const totalReservasPeriodo = todasReservas.length;

      return res.json({
        periodo: { inicio: dataInicio, fim: dataFim },
        cartoes: {
          faturamentoPeriodo,
          faturamentoHoje,
          reservasHoje: reservasHoje.length,
          reservasPeriodo: totalReservasPeriodo,
          totalQuadras,
          totalEsportes,
          totalUsuarios,
        },
        rankingEsportes,
        rankingHorarios,
        rankingQuadras,
        rankingDias,
        ultimos7Dias: ultimos7,
      });
    } catch (err) {
      next(err);
    }
  }
}

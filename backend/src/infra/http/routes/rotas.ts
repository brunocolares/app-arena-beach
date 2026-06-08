import { Router } from 'express';
import { SessaoController } from '../controllers/SessaoController';
import { UsuarioController, ClientePerfilController } from '../controllers/UsuarioController';
import { EsporteController } from '../controllers/EsporteController';
import { QuadraController } from '../controllers/QuadraController';
import { ReservaController } from '../controllers/ReservaController';
import { ConfiguracaoController } from '../controllers/ConfiguracaoController';
import { DashboardController } from '../controllers/DashboardController';
import { AdminPerfilController } from '../controllers/AdminPerfilController';
import { autenticarToken, autenticarAdmin } from '../middlewares/autenticacao';

const rotas = Router();

const sessaoCtrl       = new SessaoController();
const usuarioCtrl      = new UsuarioController();
const clientePerfilCtrl = new ClientePerfilController();
const esporteCtrl      = new EsporteController();
const quadraCtrl       = new QuadraController();
const reservaCtrl      = new ReservaController();
const configCtrl       = new ConfiguracaoController();
const dashboardCtrl    = new DashboardController();
const adminPerfilCtrl  = new AdminPerfilController();

// ─── Autenticação ─────────────────────────────────────────
rotas.post('/sessao', sessaoCtrl.criar.bind(sessaoCtrl));
rotas.get('/sessao', autenticarToken, sessaoCtrl.verificar.bind(sessaoCtrl));

// ─── Usuários (cadastro público) ──────────────────────────
rotas.post('/usuarios', usuarioCtrl.criar.bind(usuarioCtrl));

// ─── Perfil do cliente logado ─────────────────────────────
rotas.get('/perfil',           autenticarToken, clientePerfilCtrl.buscar.bind(clientePerfilCtrl));
rotas.put('/perfil',           autenticarToken, clientePerfilCtrl.atualizar.bind(clientePerfilCtrl));
rotas.put('/perfil/senha',     autenticarToken, clientePerfilCtrl.alterarSenha.bind(clientePerfilCtrl));

// ─── Esportes (públicos) ──────────────────────────────────
rotas.get('/esportes',     esporteCtrl.listar.bind(esporteCtrl));
rotas.get('/esportes/:id', esporteCtrl.buscarPorId.bind(esporteCtrl));

// Esportes (admin)
rotas.post('/esportes',       autenticarAdmin, esporteCtrl.criar.bind(esporteCtrl));
rotas.put('/esportes/:id',    autenticarAdmin, esporteCtrl.atualizar.bind(esporteCtrl));
rotas.delete('/esportes/:id', autenticarAdmin, esporteCtrl.excluir.bind(esporteCtrl));

// ─── Quadras (públicas) ───────────────────────────────────
rotas.get('/quadras',     quadraCtrl.listar.bind(quadraCtrl));
rotas.get('/quadras/:id', quadraCtrl.buscarPorId.bind(quadraCtrl));

// Quadras (admin)
rotas.post('/quadras',       autenticarAdmin, quadraCtrl.criar.bind(quadraCtrl));
rotas.put('/quadras/:id',    autenticarAdmin, quadraCtrl.atualizar.bind(quadraCtrl));
rotas.patch('/quadras/:id',  autenticarAdmin, quadraCtrl.alternarAtivacao.bind(quadraCtrl));

// ─── Horários (público) ───────────────────────────────────
rotas.get('/horarios-disponiveis', reservaCtrl.horariosDisponiveis.bind(reservaCtrl));

// ─── Reservas ─────────────────────────────────────────────
rotas.post('/reservas',          autenticarToken, reservaCtrl.criar.bind(reservaCtrl));
rotas.get('/reservas/minhas',    autenticarToken, reservaCtrl.minhasReservas.bind(reservaCtrl));
rotas.delete('/reservas/:id',    autenticarToken, reservaCtrl.cancelar.bind(reservaCtrl));

// Bloqueio admin
rotas.post('/reservas/bloqueio', autenticarAdmin, reservaCtrl.criarBloqueio.bind(reservaCtrl));

// ─── Admin ────────────────────────────────────────────────
rotas.get('/admin/agenda',    autenticarAdmin, reservaCtrl.agendaDiaria.bind(reservaCtrl));
rotas.get('/admin/dashboard', autenticarAdmin, dashboardCtrl.resumo.bind(dashboardCtrl));
rotas.get('/admin/perfil',    autenticarAdmin, adminPerfilCtrl.buscar.bind(adminPerfilCtrl));
rotas.put('/admin/perfil',    autenticarAdmin, adminPerfilCtrl.atualizar.bind(adminPerfilCtrl));
rotas.put('/admin/perfil/senha', autenticarAdmin, adminPerfilCtrl.alterarSenha.bind(adminPerfilCtrl));

// ─── Configuração ─────────────────────────────────────────
rotas.get('/configuracao', configCtrl.buscar.bind(configCtrl));
rotas.put('/configuracao', autenticarAdmin, configCtrl.atualizar.bind(configCtrl));

export { rotas };

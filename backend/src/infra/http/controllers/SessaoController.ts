import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/dataSource';
import { Usuario } from '../../../domain/entities/Usuario';
import { ErroNaoAutorizado, ErroNaoEncontrado } from '../../../shared/erros/ErrosAplicacao';
import { gerarToken } from '../middlewares/autenticacao';

export class SessaoController {
  // POST /sessao — Login
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
      }

      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { email: email.toLowerCase().trim() } });

      if (!usuario) throw new ErroNaoAutorizado('Email ou senha incorretos.');

      const senhaValida = await usuario.verificarSenha(senha);
      if (!senhaValida) throw new ErroNaoAutorizado('Email ou senha incorretos.');

      const token = gerarToken({
        id: usuario.id,
        email: usuario.email,
        is_admin: usuario.is_admin,
      });

      return res.json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          is_admin: usuario.is_admin,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /sessao — Verifica token e retorna usuário
  async verificar(req: Request, res: Response, next: NextFunction) {
    try {
      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) throw new ErroNaoEncontrado('Usuário');

      return res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        is_admin: usuario.is_admin,
      });
    } catch (err) {
      next(err);
    }
  }
}

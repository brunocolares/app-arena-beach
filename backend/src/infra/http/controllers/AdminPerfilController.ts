import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../database/dataSource';
import { Usuario } from '../../../domain/entities/Usuario';
import {
  ErroNaoEncontrado, ErroNaoAutorizado, ErroConflito, ErroValidacao
} from '../../../shared/erros/ErrosAplicacao';

export class AdminPerfilController {
  // GET /admin/perfil — Retorna dados do admin logado
  async buscar(req: Request, res: Response, next: NextFunction) {
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
        criado_em: usuario.criado_em,
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /admin/perfil — Atualiza dados do admin logado
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, email, telefone } = req.body;
      const repoUsuario = AppDataSource.getRepository(Usuario);

      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) throw new ErroNaoEncontrado('Usuário');

      // Verificar se email já está em uso por outro usuário
      if (email && email !== usuario.email) {
        const emailExistente = await repoUsuario.findOne({
          where: { email: email.toLowerCase().trim() },
        });
        if (emailExistente) throw new ErroConflito('Este email já está em uso.');
      }

      if (nome) usuario.nome = nome.trim();
      if (email) usuario.email = email.toLowerCase().trim();
      if (telefone !== undefined) usuario.telefone = telefone;

      await repoUsuario.save(usuario);

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

  // PUT /admin/perfil/senha — Altera senha do admin logado
  async alterarSenha(req: Request, res: Response, next: NextFunction) {
    try {
      const { senha_atual, nova_senha, confirmar_senha } = req.body;

      if (!senha_atual || !nova_senha || !confirmar_senha) {
        return res.status(400).json({ mensagem: 'Todos os campos de senha são obrigatórios.' });
      }
      if (nova_senha.length < 6) {
        throw new ErroValidacao('A nova senha deve ter pelo menos 6 caracteres.');
      }
      if (nova_senha !== confirmar_senha) {
        throw new ErroValidacao('A confirmação de senha não confere.');
      }

      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) throw new ErroNaoEncontrado('Usuário');

      const senhaCorreta = await bcrypt.compare(senha_atual, usuario.senha);
      if (!senhaCorreta) throw new ErroNaoAutorizado('Senha atual incorreta.');

      usuario.senha = await bcrypt.hash(nova_senha, 10);
      await repoUsuario.save(usuario);

      return res.json({ mensagem: 'Senha alterada com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}

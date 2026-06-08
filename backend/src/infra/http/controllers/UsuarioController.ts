import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/dataSource';
import { Usuario } from '../../../domain/entities/Usuario';
import { ErroConflito } from '../../../shared/erros/ErrosAplicacao';
import { gerarToken } from '../middlewares/autenticacao';

export class UsuarioController {
  // POST /usuarios — Cadastro
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, email, senha, telefone } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
      }

      const repoUsuario = AppDataSource.getRepository(Usuario);
      const jaExiste = await repoUsuario.findOne({ where: { email: email.toLowerCase().trim() } });
      if (jaExiste) throw new ErroConflito('Este email já está cadastrado.');

      const usuario = repoUsuario.create({
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        telefone,
        is_admin: false,
      });

      await repoUsuario.save(usuario);

      const token = gerarToken({
        id: usuario.id,
        email: usuario.email,
        is_admin: usuario.is_admin,
      });

      return res.status(201).json({
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
}


export class ClientePerfilController {
  // GET /perfil — Dados do cliente logado
  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

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

  // PUT /perfil — Atualiza dados do cliente
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, email, telefone } = req.body;
      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

      if (email && email !== usuario.email) {
        const emailExistente = await repoUsuario.findOne({ where: { email: email.toLowerCase().trim() } });
        if (emailExistente) return res.status(409).json({ mensagem: 'Este email já está em uso.' });
      }

      if (nome) usuario.nome = nome.trim();
      if (email) usuario.email = email.toLowerCase().trim();
      if (telefone !== undefined) usuario.telefone = telefone;

      await repoUsuario.save(usuario);
      return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone, is_admin: usuario.is_admin });
    } catch (err) {
      next(err);
    }
  }

  // PUT /perfil/senha — Altera senha do cliente
  async alterarSenha(req: Request, res: Response, next: NextFunction) {
    try {
      const bcrypt = await import('bcryptjs');
      const { senha_atual, nova_senha, confirmar_senha } = req.body;

      if (!senha_atual || !nova_senha || !confirmar_senha)
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
      if (nova_senha.length < 6)
        return res.status(422).json({ mensagem: 'A nova senha deve ter pelo menos 6 caracteres.' });
      if (nova_senha !== confirmar_senha)
        return res.status(422).json({ mensagem: 'A confirmação de senha não confere.' });

      const repoUsuario = AppDataSource.getRepository(Usuario);
      const usuario = await repoUsuario.findOne({ where: { id: req.usuarioLogado!.id } });
      if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

      const senhaCorreta = await bcrypt.default.compare(senha_atual, usuario.senha);
      if (!senhaCorreta) return res.status(401).json({ mensagem: 'Senha atual incorreta.' });

      usuario.senha = await bcrypt.default.hash(nova_senha, 10);
      await repoUsuario.save(usuario);
      return res.json({ mensagem: 'Senha alterada com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}

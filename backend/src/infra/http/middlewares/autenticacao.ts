import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErroNaoAutorizado } from '../../../shared/erros/ErrosAplicacao';

export const JWT_SEGREDO = process.env.JWT_SECRET || 'arena_beach_secret_2024';

export interface PayloadToken {
  id: string;
  email: string;
  is_admin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      usuarioLogado?: PayloadToken;
    }
  }
}

export function autenticarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new ErroNaoAutorizado('Token não fornecido.');
  }

  try {
    const payload = jwt.verify(token, JWT_SEGREDO) as PayloadToken;
    req.usuarioLogado = payload;
    next();
  } catch {
    throw new ErroNaoAutorizado('Token inválido ou expirado.');
  }
}

export function autenticarAdmin(req: Request, res: Response, next: NextFunction) {
  autenticarToken(req, res, () => {
    if (!req.usuarioLogado?.is_admin) {
      throw new ErroNaoAutorizado('Acesso restrito a administradores.');
    }
    next();
  });
}

export function gerarToken(payload: PayloadToken): string {
  return jwt.sign(payload, JWT_SEGREDO, { expiresIn: '7d' });
}

import { Request, Response, NextFunction } from "express";
import { ErroAplicacao } from "../../../shared/erros/ErrosAplicacao";

export function manipuladorErros(
  erro: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.codigo).json({ mensagem: erro.message });
  }

  console.error("Erro interno:", erro);
  return res.status(500).json({ mensagem: "Erro interno do servidor." });
}

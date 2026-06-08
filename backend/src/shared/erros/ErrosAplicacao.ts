export class ErroAplicacao extends Error {
  public readonly codigo: number;

  constructor(mensagem: string, codigo: number = 400) {
    super(mensagem);
    this.codigo = codigo;
    this.name = 'ErroAplicacao';
  }
}

export class ErroNaoEncontrado extends ErroAplicacao {
  constructor(recurso: string) {
    super(`${recurso} não encontrado(a).`, 404);
    this.name = 'ErroNaoEncontrado';
  }
}

export class ErroNaoAutorizado extends ErroAplicacao {
  constructor(mensagem = 'Não autorizado.') {
    super(mensagem, 401);
    this.name = 'ErroNaoAutorizado';
  }
}

export class ErroConflito extends ErroAplicacao {
  constructor(mensagem: string) {
    super(mensagem, 409);
    this.name = 'ErroConflito';
  }
}

export class ErroValidacao extends ErroAplicacao {
  constructor(mensagem: string) {
    super(mensagem, 422);
    this.name = 'ErroValidacao';
  }
}

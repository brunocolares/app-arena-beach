// Tipos compartilhados da aplicação

export interface Esporte {
  id: string;
  nome_esporte: string;
  imagem_url: string;
  quadras?: number;
  preco_partir?: string;
}

export interface Quadra {
  id: string;
  esporte_id: string;
  esportes_ids?: string[];
  nome_quadra: string;
  preco_hora: number;
  fotos: string[];
  ativa: boolean;
  diferenciais?: string[];
  avaliacao?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  is_admin: boolean;
}

export interface Reserva {
  id: string;
  usuario_id: string;
  quadra_id: string;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: "reserva" | "bloqueio";
  status?: "ativa" | "cancelada" | "concluida";
  usuario?: Usuario;
  quadra?: Quadra;
}

export interface ConfiguracaoArena {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  hora_abertura: string;
  hora_fechamento: string;
}

export interface SlotHorario {
  horario: string;
  disponivel: boolean;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface CadastroPayload {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
}

export interface AuthResposta {
  token: string;
  usuario: Usuario;
}

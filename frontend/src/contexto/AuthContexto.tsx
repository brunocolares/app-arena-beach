import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, salvarToken, removerToken, obterToken } from "../shared/api";
import {
  Usuario,
  LoginPayload,
  CadastroPayload,
  AuthResposta,
} from "../shared/tipos";

interface AuthContextoTipo {
  usuario: Usuario | null;
  carregando: boolean;
  autenticado: boolean;
  entrar: (dados: LoginPayload) => Promise<void>;
  cadastrar: (dados: CadastroPayload) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContexto = createContext<AuthContextoTipo>({} as AuthContextoTipo);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarToken();
  }, []);

  async function verificarToken() {
    try {
      const token = await obterToken();
      if (token) {
        const resposta = await api.get<Usuario>("/sessao");
        setUsuario(resposta.data);
      }
    } catch {
      await removerToken();
    } finally {
      setCarregando(false);
    }
  }

  async function entrar(dados: LoginPayload) {
    const resposta = await api.post<AuthResposta>("/sessao", dados);
    await salvarToken(resposta.data.token);
    setUsuario(resposta.data.usuario);
    queryClient.invalidateQueries({ queryKey: ["perfil-cliente"] });
    queryClient.invalidateQueries({ queryKey: ["minhas-reservas"] });
  }

  async function cadastrar(dados: CadastroPayload) {
    const resposta = await api.post<AuthResposta>("/usuarios", dados);
    await salvarToken(resposta.data.token);
    setUsuario(resposta.data.usuario);
    queryClient.invalidateQueries({ queryKey: ["perfil-cliente"] });
    queryClient.invalidateQueries({ queryKey: ["minhas-reservas"] });
  }

  async function sair() {
    await removerToken();
    setUsuario(null);
    queryClient.removeQueries({ queryKey: ["perfil-cliente"] });
    queryClient.removeQueries({ queryKey: ["minhas-reservas"] });
  }

  return (
    <AuthContexto.Provider
      value={{
        usuario,
        carregando,
        autenticado: !!usuario,
        entrar,
        cadastrar,
        sair,
      }}
    >
      {children}
    </AuthContexto.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContexto);
  if (!contexto)
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return contexto;
}

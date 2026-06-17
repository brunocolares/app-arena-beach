import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexto/AuthContexto";
import { api } from "../../shared/api";
import { CampoTexto } from "../../componentes/CampoTexto";
import { Botao } from "../../componentes/Botao";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";

// ─── Tipos ────────────────────────────────────────────────
interface DadosPerfilAdmin {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  is_admin: boolean;
  criado_em: string;
}

interface PayloadAtualizarPerfil {
  nome: string;
  email: string;
  telefone: string;
}

interface PayloadAlterarSenha {
  senha_atual: string;
  nova_senha: string;
  confirmar_senha: string;
}

// ─── API ──────────────────────────────────────────────────
async function buscarPerfilAdmin(): Promise<DadosPerfilAdmin> {
  const r = await api.get("/admin/perfil");
  return r.data;
}

async function atualizarPerfilAdmin(
  dados: PayloadAtualizarPerfil,
): Promise<DadosPerfilAdmin> {
  const r = await api.put("/admin/perfil", dados);
  return r.data;
}

async function alterarSenhaAdmin(dados: PayloadAlterarSenha): Promise<void> {
  await api.put("/admin/perfil/senha", dados);
}

// ─── Abas internas ────────────────────────────────────────
type Aba = "dados" | "senha";

// ─── Tela ─────────────────────────────────────────────────
export function TelaPerfilAdmin() {
  const insets = useSafeAreaInsets();
  const { sair } = useAuth();
  const queryClient = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("dados");

  // ── Estado dos campos de dados ─────────────────────────
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [errosDados, setErrosDados] = useState<Record<string, string>>({});

  // ── Estado dos campos de senha ─────────────────────────
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});

  // ── Query ──────────────────────────────────────────────
  const { data: perfil, isLoading } = useQuery({
    queryKey: ["perfil-admin"],
    queryFn: buscarPerfilAdmin,
  });

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome || "");
      setEmail(perfil.email || "");
      setTelefone(perfil.telefone || "");
    }
  }, [perfil]);

  // ── Mutação: atualizar dados ───────────────────────────
  const mutacaoDados = useMutation({
    mutationFn: atualizarPerfilAdmin,
    onSuccess: (dadosAtualizados) => {
      queryClient.invalidateQueries({ queryKey: ["perfil-admin"] });
      queryClient.invalidateQueries({ queryKey: ["sessao"] });
      Alert.alert("Sucesso", "Seus dados foram atualizados!");
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  // ── Mutação: alterar senha ─────────────────────────────
  const mutacaoSenha = useMutation({
    mutationFn: alterarSenhaAdmin,
    onSuccess: () => {
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  // ── Validações ─────────────────────────────────────────
  function validarDados(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome é obrigatório";
    if (!email.trim()) e.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    setErrosDados(e);
    return Object.keys(e).length === 0;
  }

  function validarSenha(): boolean {
    const e: Record<string, string> = {};
    if (!senhaAtual) e.senhaAtual = "Senha atual é obrigatória";
    if (!novaSenha) e.novaSenha = "Nova senha é obrigatória";
    else if (novaSenha.length < 6) e.novaSenha = "Mínimo 6 caracteres";
    if (novaSenha !== confirmarSenha)
      e.confirmarSenha = "As senhas não conferem";
    setErrosSenha(e);
    return Object.keys(e).length === 0;
  }

  function aoSalvarDados() {
    if (!validarDados()) return;
    mutacaoDados.mutate({ nome: nome.trim(), email: email.trim(), telefone });
  }

  function aoAlterarSenha() {
    if (!validarSenha()) return;
    mutacaoSenha.mutate({
      senha_atual: senhaAtual,
      nova_senha: novaSenha,
      confirmar_senha: confirmarSenha,
    });
  }

  function aoSair() {
    Alert.alert("Sair", "Deseja mesmo sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: sair },
    ]);
  }

  if (isLoading) {
    return (
      <View
        style={[
          estilos.container,
          { paddingTop: insets.top },
          estilos.centralizado,
        ]}
      >
        <ActivityIndicator size="large" color={Cores.primaria} />
      </View>
    );
  }

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Meu Perfil</Text>
      </View>

      {/* Avatar + info rápida */}
      <View style={estilos.bannerPerfil}>
        <View style={estilos.avatar}>
          <Text style={estilos.inicialAvatar}>
            {perfil?.nome?.charAt(0).toUpperCase() || "A"}
          </Text>
        </View>
        <View style={estilos.infoAvatar}>
          <Text style={estilos.nomeAvatar}>{perfil?.nome}</Text>
          <Text style={estilos.emailAvatar}>{perfil?.email}</Text>
          <View style={estilos.badgeAdmin}>
            <Text style={estilos.textoBadgeAdmin}>Administrador</Text>
          </View>
        </View>
      </View>

      {/* Abas */}
      <View style={estilos.abas}>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === "dados" && estilos.abaAtiva]}
          onPress={() => setAbaAtiva("dados")}
        >
          <Text
            style={[
              estilos.textoAba,
              abaAtiva === "dados" && estilos.textoAbaAtivo,
            ]}
          >
            Meus Dados
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === "senha" && estilos.abaAtiva]}
          onPress={() => setAbaAtiva("senha")}
        >
          <Text
            style={[
              estilos.textoAba,
              abaAtiva === "senha" && estilos.textoAbaAtivo,
            ]}
          >
            Alterar Senha
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Aba: Dados pessoais ─────────────────────── */}
        {abaAtiva === "dados" && (
          <View style={estilos.secao}>
            <CampoTexto
              label="Nome completo"
              placeholder="Seu nome"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
              erro={errosDados.nome}
            />
            <CampoTexto
              label="Email"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              erro={errosDados.email}
            />
            <CampoTexto
              label="Telefone"
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />

            <View style={estilos.avisoEmail}>
              <Text style={estilos.textoAviso}>
                Alterar o email exige novo login na próxima sessão.
              </Text>
            </View>

            <Botao
              titulo="Salvar alterações"
              onPress={aoSalvarDados}
              carregando={mutacaoDados.isPending}
            />
          </View>
        )}

        {/* ── Aba: Alterar senha ──────────────────────── */}
        {abaAtiva === "senha" && (
          <View style={estilos.secao}>
            <View style={estilos.dicaSenha}>
              <Text style={estilos.textoDica}>
                A senha deve ter pelo menos 6 caracteres.
              </Text>
            </View>

            <CampoTexto
              label="Senha atual"
              placeholder="Digite sua senha atual"
              senhaToggle
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              erro={errosSenha.senhaAtual}
            />
            <CampoTexto
              label="Nova senha"
              placeholder="Mínimo 6 caracteres"
              senhaToggle
              value={novaSenha}
              onChangeText={setNovaSenha}
              erro={errosSenha.novaSenha}
            />
            <CampoTexto
              label="Confirmar nova senha"
              placeholder="Repita a nova senha"
              senhaToggle
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              erro={errosSenha.confirmarSenha}
            />

            <Botao
              titulo="Alterar senha"
              onPress={aoAlterarSenha}
              carregando={mutacaoSenha.isPending}
            />
          </View>
        )}

        {/* Botão sair */}
        <TouchableOpacity style={estilos.botaoSair} onPress={aoSair}>
          <Text style={estilos.textoBotaoSair}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────
const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  centralizado: { justifyContent: "center", alignItems: "center" },

  cabecalho: {
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  tituloCabecalho: { ...Tipografia.titulo2 },

  bannerPerfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    padding: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Cores.primaria,
    justifyContent: "center",
    alignItems: "center",
  },
  inicialAvatar: { color: Cores.texto, fontSize: 28, fontWeight: "800" },
  infoAvatar: { flex: 1, gap: 3 },
  nomeAvatar: { color: Cores.texto, fontSize: 16, fontWeight: "700" },
  emailAvatar: { color: Cores.textoSecundario, fontSize: 13 },
  badgeAdmin: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.6)",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  textoBadgeAdmin: { color: "#FFD700", fontSize: 12, fontWeight: "600" },

  abas: {
    flexDirection: "row",
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  aba: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  abaAtiva: { borderBottomColor: Cores.primaria },
  textoAba: { color: Cores.textoSecundario, fontSize: 14, fontWeight: "500" },
  textoAbaAtivo: { color: Cores.primaria, fontWeight: "700" },

  scroll: { padding: Espacamento.md, paddingBottom: 40 },
  secao: { gap: 0 },

  avisoEmail: {
    backgroundColor: "rgba(255,193,7,0.1)",
    borderRadius: 10,
    padding: Espacamento.sm,
    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.4)",
    marginBottom: Espacamento.md,
  },
  textoAviso: { color: Cores.aviso, fontSize: 12, lineHeight: 18 },

  dicaSenha: {
    backgroundColor: "rgba(108,99,255,0.1)",
    borderRadius: 10,
    padding: Espacamento.sm,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    marginBottom: Espacamento.md,
  },
  textoDica: { color: Cores.primaria, fontSize: 13, lineHeight: 18 },

  botaoSair: {
    marginTop: Espacamento.xl,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Cores.erro,
    alignItems: "center",
  },
  textoBotaoSair: { color: Cores.erro, fontWeight: "700", fontSize: 16 },
});

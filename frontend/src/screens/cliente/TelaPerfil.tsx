import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexto/AuthContexto';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Botao } from '../../componentes/Botao';
import { api } from '../../shared/api';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

// ─── API ──────────────────────────────────────────────────
async function buscarPerfil() {
  const r = await api.get('/perfil');
  return r.data;
}
async function atualizarPerfil(dados: { nome: string; email: string; telefone: string }) {
  const r = await api.put('/perfil', dados);
  return r.data;
}
async function alterarSenha(dados: { senha_atual: string; nova_senha: string; confirmar_senha: string }) {
  await api.put('/perfil/senha', dados);
}

type Aba = 'dados' | 'senha';

// ─── Tela principal ───────────────────────────────────────
export function TelaPerfil() {
  const insets = useSafeAreaInsets();
  const navegacao = useNavigation<any>();
  const { usuario, autenticado, sair } = useAuth();
  const queryClient = useQueryClient();

  const [abaAtiva, setAbaAtiva] = useState<Aba>('dados');

  // Campos dados
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errosDados, setErrosDados] = useState<Record<string, string>>({});

  // Campos senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil-cliente'],
    queryFn: buscarPerfil,
    enabled: autenticado,
  });

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome || '');
      setEmail(perfil.email || '');
      setTelefone(perfil.telefone || '');
    }
  }, [perfil]);

  const mutacaoDados = useMutation({
    mutationFn: atualizarPerfil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-cliente'] });
      Alert.alert('✅ Sucesso', 'Seus dados foram atualizados!');
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const mutacaoSenha = useMutation({
    mutationFn: alterarSenha,
    onSuccess: () => {
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
      Alert.alert('✅ Sucesso', 'Senha alterada com sucesso!');
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  function validarDados(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório';
    if (!email.trim()) e.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    setErrosDados(e);
    return Object.keys(e).length === 0;
  }

  function validarSenha(): boolean {
    const e: Record<string, string> = {};
    if (!senhaAtual) e.senhaAtual = 'Senha atual é obrigatória';
    if (!novaSenha) e.novaSenha = 'Nova senha é obrigatória';
    else if (novaSenha.length < 6) e.novaSenha = 'Mínimo 6 caracteres';
    if (novaSenha !== confirmarSenha) e.confirmarSenha = 'As senhas não conferem';
    setErrosSenha(e);
    return Object.keys(e).length === 0;
  }

  function aoSair() {
    Alert.alert('Sair', 'Deseja mesmo sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair },
    ]);
  }

  // ── Não autenticado ────────────────────────────────────
  if (!autenticado) {
    return (
      <View style={[estilos.container, { paddingTop: insets.top }]}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.tituloCabecalho}>Perfil</Text>
        </View>
        <View style={estilos.centralizado}>
          <Text style={estilos.iconeAvatar}>👤</Text>
          <Text style={estilos.textoVazio}>Você não está logado</Text>
          <TouchableOpacity
            style={estilos.botaoLogin}
            onPress={() => navegacao.navigate('Login' as never)}
          >
            <Text style={estilos.textoBotaoLogin}>Entrar na conta</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => (navegacao as any).navigate('Cadastro')}>
            <Text style={[estilos.textoLink, { marginTop: 12 }]}>Criar nova conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[estilos.container, { paddingTop: insets.top }, estilos.centralizado]}>
        <ActivityIndicator size="large" color={Cores.primaria} />
      </View>
    );
  }

  // ── Autenticado ────────────────────────────────────────
  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Perfil</Text>
      </View>

      {/* Banner com avatar */}
      <View style={estilos.banner}>
        <View style={estilos.avatar}>
          <Text style={estilos.inicialAvatar}>
            {perfil?.nome?.charAt(0).toUpperCase() || usuario?.nome?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={estilos.infoBanner}>
          <Text style={estilos.nomeBanner}>{perfil?.nome || usuario?.nome}</Text>
          <Text style={estilos.emailBanner}>{perfil?.email || usuario?.email}</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={estilos.abas}>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === 'dados' && estilos.abaAtiva]}
          onPress={() => setAbaAtiva('dados')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'dados' && estilos.textoAbaAtivo]}>
            ✏️ Meus Dados
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.aba, abaAtiva === 'senha' && estilos.abaAtiva]}
          onPress={() => setAbaAtiva('senha')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'senha' && estilos.textoAbaAtivo]}>
            🔒 Alterar Senha
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Aba dados */}
        {abaAtiva === 'dados' && (
          <View>
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
            <Botao
              titulo="Salvar alterações"
              onPress={() => { if (validarDados()) mutacaoDados.mutate({ nome, email, telefone }); }}
              carregando={mutacaoDados.isPending}
            />
          </View>
        )}

        {/* Aba senha */}
        {abaAtiva === 'senha' && (
          <View>
            <View style={estilos.dicaSenha}>
              <Text style={estilos.textoDica}>🔐 Mínimo de 6 caracteres para a nova senha.</Text>
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
              onPress={() => { if (validarSenha()) mutacaoSenha.mutate({ senha_atual: senhaAtual, nova_senha: novaSenha, confirmar_senha: confirmarSenha }); }}
              carregando={mutacaoSenha.isPending}
            />
          </View>
        )}

        {/* Sair */}
        <TouchableOpacity style={estilos.botaoSair} onPress={aoSair}>
          <Text style={estilos.textoBotaoSair}>Sair da conta</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  cabecalho: {
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  tituloCabecalho: { ...Tipografia.titulo2 },
  // não autenticado
  iconeAvatar: { fontSize: 64 },
  textoVazio: { ...Tipografia.corpo, color: Cores.textoSecundario },
  botaoLogin: {
    backgroundColor: Cores.primaria,
    paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10,
  },
  textoBotaoLogin: { color: Cores.texto, fontWeight: '700', fontSize: 15 },
  textoLink: { color: Cores.primaria, fontSize: 15 },
  // banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    padding: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Cores.primaria,
    justifyContent: 'center', alignItems: 'center',
  },
  inicialAvatar: { color: Cores.texto, fontSize: 24, fontWeight: '800' },
  infoBanner: { flex: 1 },
  nomeBanner: { color: Cores.texto, fontSize: 16, fontWeight: '700' },
  emailBanner: { color: Cores.textoSecundario, fontSize: 13, marginTop: 2 },
  // abas
  abas: {
    flexDirection: 'row',
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  aba: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  abaAtiva: { borderBottomColor: Cores.primaria },
  textoAba: { color: Cores.textoSecundario, fontSize: 14, fontWeight: '500' },
  textoAbaAtivo: { color: Cores.primaria, fontWeight: '700' },
  // conteúdo
  scroll: { padding: Espacamento.md, paddingBottom: 40 },
  dicaSenha: {
    backgroundColor: 'rgba(108,99,255,0.1)',
    borderRadius: 10, padding: Espacamento.sm,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
    marginBottom: Espacamento.md,
  },
  textoDica: { color: Cores.primaria, fontSize: 13 },
  botaoSair: {
    marginTop: Espacamento.xl, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Cores.erro, alignItems: 'center',
  },
  textoBotaoSair: { color: Cores.erro, fontWeight: '700', fontSize: 16 },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexto/AuthContexto';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Botao } from '../../componentes/Botao';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TelaCadastro() {
  const navegacao = useNavigation<any>();
  const { cadastrar } = useAuth();
  const insets = useSafeAreaInsets();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório';
    if (!email.trim()) e.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!telefone.trim()) e.telefone = 'Telefone é obrigatório';
    if (!senha) e.senha = 'Senha é obrigatória';
    else if (senha.length < 6) e.senha = 'Mínimo 6 caracteres';
    if (senha !== confirmarSenha) e.confirmarSenha = 'As senhas não conferem';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function aoCadastrar() {
    if (!validar()) return;
    setCarregando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), telefone, senha });
      // Após cadastro, vai direto para Home (reset para não acumular telas na pilha)
      (navegacao as any).reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (erro: any) {
      Alert.alert('Erro ao cadastrar', erro.message || 'Tente novamente');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[estilos.scroll, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navegacao.goBack()} style={estilos.botaoVoltar}>
          <Text style={estilos.textoVoltar}>← Voltar</Text>
        </TouchableOpacity>

        <View style={estilos.header}>
          <Text style={estilos.logo}>⚡</Text>
          <Text style={estilos.titulo}>Criar conta</Text>
          <Text style={estilos.subtitulo}>Cadastre-se para reservar sua quadra</Text>
        </View>

        <View style={estilos.formulario}>
          <CampoTexto
            label="Nome completo"
            placeholder="Seu nome"
            autoCapitalize="words"
            value={nome}
            onChangeText={setNome}
            erro={erros.nome}
          />
          <CampoTexto
            label="Email"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            erro={erros.email}
          />
          <CampoTexto
            label="Telefone"
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
            erro={erros.telefone}
          />
          <CampoTexto
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            senhaToggle
            value={senha}
            onChangeText={setSenha}
            erro={erros.senha}
          />
          <CampoTexto
            label="Confirmar senha"
            placeholder="Repita a senha"
            senhaToggle
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            erro={erros.confirmarSenha}
          />

          <Botao titulo="Criar conta" onPress={aoCadastrar} carregando={carregando} />
        </View>

        <View style={estilos.rodapeLogin}>
          <Text style={estilos.textoRodape}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => (navegacao as any).navigate('Login')}>
            <Text style={[estilos.textoRodape, { color: Cores.primaria, fontWeight: '700' }]}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { flexGrow: 1, paddingHorizontal: Espacamento.md, paddingBottom: Espacamento.xxl },
  botaoVoltar: { marginBottom: Espacamento.md },
  textoVoltar: { color: Cores.primaria, fontSize: 15, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: Espacamento.xl, gap: 8 },
  logo: { fontSize: 48, marginBottom: 8 },
  titulo: { ...Tipografia.titulo1, textAlign: 'center' },
  subtitulo: { ...Tipografia.corpoPequeno, textAlign: 'center' },
  formulario: { gap: 0 },
  rodapeLogin: { flexDirection: 'row', justifyContent: 'center', marginTop: Espacamento.lg },
  textoRodape: { color: Cores.textoSecundario, fontSize: 15 },
});

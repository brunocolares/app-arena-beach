import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexto/AuthContexto';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Botao } from '../../componentes/Botao';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TelaLogin() {
  const navegacao = useNavigation<any>();
  const rota = useRoute<any>();
  const { entrar } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});

  function validarCampos(): boolean {
    const novosErros: { email?: string; senha?: string } = {};
    if (!email.trim()) novosErros.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) novosErros.email = 'Email inválido';
    if (!senha) novosErros.senha = 'Senha é obrigatória';
    else if (senha.length < 6) novosErros.senha = 'Mínimo 6 caracteres';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function aoEntrar() {
    if (!validarCampos()) return;
    setCarregando(true);
    try {
      await entrar({ email: email.trim(), senha });
      // Após login, navega de volta
      navegacao.goBack();
    } catch (erro: any) {
      Alert.alert('Erro ao entrar', erro.message || 'Email ou senha incorretos');
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
        {/* Botão voltar */}
        <TouchableOpacity onPress={() => navegacao.goBack()} style={estilos.botaoVoltar}>
          <Text style={estilos.textoVoltar}>← Voltar</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={estilos.header}>
          <Text style={estilos.logo}>🏟️</Text>
          <Text style={estilos.titulo}>Bem-vindo de volta!</Text>
          <Text style={estilos.subtitulo}>Entre para confirmar sua reserva</Text>
        </View>

        {/* Formulário */}
        <View style={estilos.formulario}>
          <CampoTexto
            label="Email"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            erro={erros.email}
          />
          <CampoTexto
            label="Senha"
            placeholder="Sua senha"
            senhaToggle
            value={senha}
            onChangeText={setSenha}
            erro={erros.senha}
          />

          <TouchableOpacity style={estilos.linkEsqueceu}>
            <Text style={estilos.textoLink}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <Botao titulo="Entrar" onPress={aoEntrar} carregando={carregando} />
        </View>

        {/* Rodapé */}
        <View style={estilos.rodapeCadastro}>
          <Text style={estilos.textoCadastro}>Ainda não tem conta? </Text>
          <TouchableOpacity onPress={() => (navegacao as any).navigate('Cadastro')}>
            <Text style={[estilos.textoCadastro, { color: Cores.primaria, fontWeight: '700' }]}>
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Espacamento.md,
    paddingBottom: Espacamento.xxl,
  },
  botaoVoltar: { marginBottom: Espacamento.md },
  textoVoltar: { color: Cores.primaria, fontSize: 15, fontWeight: '600' },
  header: {
    alignItems: 'center',
    marginBottom: Espacamento.xl,
    gap: 8,
  },
  logo: { fontSize: 56, marginBottom: 8 },
  titulo: { ...Tipografia.titulo1, textAlign: 'center' },
  subtitulo: { ...Tipografia.corpoPequeno, textAlign: 'center' },
  formulario: { gap: 0 },
  linkEsqueceu: { alignSelf: 'flex-end', marginBottom: Espacamento.lg, marginTop: -4 },
  textoLink: { color: Cores.primaria, fontSize: 14 },
  rodapeCadastro: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Espacamento.lg,
  },
  textoCadastro: { color: Cores.textoSecundario, fontSize: 15 },

});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../shared/api';
import { ConfiguracaoArena } from '../../shared/tipos';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Botao } from '../../componentes/Botao';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

async function buscarConfiguracao(): Promise<ConfiguracaoArena> {
  const r = await api.get('/configuracao');
  return r.data;
}

async function salvarConfiguracao(dados: Partial<ConfiguracaoArena>): Promise<ConfiguracaoArena> {
  const r = await api.put('/configuracao', dados);
  return r.data;
}

export function TelaAjustesArena() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navegacao = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [horaAbertura, setHoraAbertura] = useState('');
  const [horaFechamento, setHoraFechamento] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: buscarConfiguracao,
  });

  useEffect(() => {
    if (config) {
      setNome(config.nome || '');
      setEndereco(config.endereco || '');
      setTelefone(config.telefone || '');
      setHoraAbertura(config.hora_abertura || '');
      setHoraFechamento(config.hora_fechamento || '');
    }
  }, [config]);

  const mutacao = useMutation({
    mutationFn: salvarConfiguracao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });
      Alert.alert('Sucesso', 'Configurações salvas!');
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  function aoSalvar() {
    mutacao.mutate({
      nome, endereco, telefone,
      hora_abertura: horaAbertura,
      hora_fechamento: horaFechamento,
    });
  }

  if (isLoading) {
    return (
      <View style={[estilos.container, { paddingTop: insets.top }, estilos.centralizado]}>
        <ActivityIndicator size="large" color={Cores.primaria} />
      </View>
    );
  }

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>

        {/* Acesso rápido ao perfil do admin */}
        <TouchableOpacity
          style={estilos.cardPerfil}
          onPress={() => navegacao.navigate('PerfilAdmin')}
          activeOpacity={0.8}
        >
          <View style={estilos.cardPerfilIcone}>
            <Text style={estilos.iconeCartaoPerfil}>👤</Text>
          </View>
          <View style={estilos.cardPerfilInfo}>
            <Text style={estilos.cardPerfilTitulo}>Meu Perfil</Text>
            <Text style={estilos.cardPerfilSub}>Alterar email, senha e dados pessoais</Text>
          </View>
          <Text style={estilos.setaPerfil}>›</Text>
        </TouchableOpacity>

        <View style={estilos.separador} />

        {/* Dados da Arena */}
        <View style={estilos.secao}>
          <Text style={estilos.labelSecao}>📋 Dados Institucionais</Text>
          <CampoTexto
            label="Nome da arena"
            placeholder="Ex: Arena Beach Pulse"
            value={nome}
            onChangeText={setNome}
          />
          <CampoTexto
            label="Endereço"
            placeholder="Rua, número, bairro, cidade"
            value={endereco}
            onChangeText={setEndereco}
          />
          <CampoTexto
            label="Telefone / WhatsApp"
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.labelSecao}>🕐 Horário de Funcionamento</Text>
          <View style={estilos.linhaHorario}>
            <View style={{ flex: 1 }}>
              <CampoTexto
                label="Abertura"
                placeholder="07:00"
                value={horaAbertura}
                onChangeText={setHoraAbertura}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={estilos.separadorHorario}>
              <Text style={estilos.textoSeparador}>→</Text>
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                label="Fechamento"
                placeholder="22:00"
                value={horaFechamento}
                onChangeText={setHoraFechamento}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <Botao
          titulo="Salvar configurações"
          onPress={aoSalvar}
          carregando={mutacao.isPending}
        />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  centralizado: { justifyContent: 'center', alignItems: 'center' },
  cabecalho: {
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  tituloCabecalho: { ...Tipografia.titulo2 },
  scroll: { padding: Espacamento.md, paddingBottom: 40 },

  // Card de perfil
  cardPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.primaria,
    gap: 12,
    marginBottom: Espacamento.md,
  },
  cardPerfilIcone: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(108,99,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconeCartaoPerfil: { fontSize: 22 },
  cardPerfilInfo: { flex: 1 },
  cardPerfilTitulo: { color: Cores.texto, fontSize: 15, fontWeight: '700' },
  cardPerfilSub: { color: Cores.textoSecundario, fontSize: 12, marginTop: 2 },
  setaPerfil: { color: Cores.primaria, fontSize: 24, fontWeight: '300' },

  separador: {
    height: 1,
    backgroundColor: Cores.borda,
    marginBottom: Espacamento.lg,
  },

  secao: { marginBottom: Espacamento.lg },
  labelSecao: { ...Tipografia.titulo3, marginBottom: Espacamento.md },
  linhaHorario: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  separadorHorario: {
    paddingTop: 38,
    alignItems: 'center',
    width: 24,
  },
  textoSeparador: {
    color: Cores.textoSecundario,
    fontSize: 18,
  },
});

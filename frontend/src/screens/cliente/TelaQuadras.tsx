import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api';
import { Quadra } from '../../shared/tipos';
import { CardQuadra } from '../../componentes/CardQuadra';
import { Cabecalho } from '../../componentes/Cabecalho';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';
import { HomeStackParams } from '../../routes/ClienteTabs';

type NavProp = NativeStackNavigationProp<HomeStackParams, 'Quadras'>;
type RotaProp = RouteProp<HomeStackParams, 'Quadras'>;

async function buscarQuadrasPorEsporte(esporteId: string): Promise<Quadra[]> {
  const resposta = await api.get(`/quadras?esporte_id=${esporteId}`);
  return resposta.data;
}

export function TelaQuadras() {
  const navegacao = useNavigation<NavProp>();
  const rota = useRoute<RotaProp>();
  const { esporte } = rota.params;

  const { data: quadras, isLoading, isError, refetch } = useQuery({
    queryKey: ['quadras', esporte.id],
    queryFn: () => buscarQuadrasPorEsporte(esporte.id),
  });

  function aoSelecionarQuadra(quadra: Quadra) {
    navegacao.navigate('Horarios', { quadra });
  }

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo={esporte.nome_esporte}
        subtitulo="Quadras disponíveis"
        onVoltar={() => navegacao.goBack()}
      />

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
          <Text style={estilos.textoCarregando}>Buscando quadras...</Text>
        </View>
      ) : isError ? (
        <View style={estilos.centralizado}>
          <Text style={estilos.textoErro}>⚠️ Erro ao carregar quadras</Text>
          <TouchableOpacity onPress={() => refetch()} style={estilos.botaoTentar}>
            <Text style={estilos.textoBotao}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quadras}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={estilos.contador}>
              {quadras?.length || 0} quadra{(quadras?.length || 0) !== 1 ? 's' : ''} encontrada{(quadras?.length || 0) !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <CardQuadra quadra={item} onPress={() => aoSelecionarQuadra(item)} />
          )}
          ListEmptyComponent={
            <View style={estilos.centralizado}>
              <Text style={estilos.textoVazio}>Nenhuma quadra disponível para esta modalidade</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo,
  },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  lista: {
    padding: Espacamento.md,
    paddingBottom: Espacamento.xxl,
  },
  contador: {
    ...Tipografia.corpoPequeno,
    marginBottom: Espacamento.md,
  },
  textoCarregando: {
    ...Tipografia.corpoPequeno,
  },
  textoErro: {
    color: Cores.erro,
    fontSize: 16,
  },
  botaoTentar: {
    backgroundColor: Cores.primaria,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  textoBotao: {
    color: Cores.texto,
    fontWeight: '600',
  },
  textoVazio: {
    ...Tipografia.corpoPequeno,
    textAlign: 'center',
    padding: Espacamento.md,
  },
});

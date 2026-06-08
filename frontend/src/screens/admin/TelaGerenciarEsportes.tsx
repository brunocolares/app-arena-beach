import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../shared/api';
import { Esporte } from '../../shared/tipos';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

async function buscarEsportes(): Promise<Esporte[]> {
  const r = await api.get('/esportes');
  return r.data;
}

async function excluirEsporte(id: string): Promise<void> {
  await api.delete(`/esportes/${id}`);
}

export function TelaGerenciarEsportes() {
  const insets = useSafeAreaInsets();
  const navegacao = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: esportes, isLoading } = useQuery({
    queryKey: ['esportes'],
    queryFn: buscarEsportes,
  });

  const mutacaoExcluir = useMutation({
    mutationFn: excluirEsporte,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esportes'] }),
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  function aoExcluir(esporte: Esporte) {
    Alert.alert(
      'Excluir esporte',
      `Deseja excluir "${esporte.nome_esporte}"? As quadras vinculadas serão afetadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => mutacaoExcluir.mutate(esporte.id) },
      ]
    );
  }

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Gerenciar Esportes</Text>
        <TouchableOpacity
          style={estilos.botaoAdicionar}
          onPress={() => navegacao.navigate('FormularioEsporte', { esporte: null })}
        >
          <Text style={estilos.textoBotaoAdicionar}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
        </View>
      ) : (
        <FlatList
          data={esportes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={estilos.card}>
              <Image
                source={item.imagem_url ? { uri: item.imagem_url } : require('../../assets/placeholder_esporte.png')}
                style={estilos.imagemCard}
                resizeMode="cover"
              />
              <View style={estilos.infoCard}>
                <Text style={estilos.nomeEsporte}>{item.nome_esporte}</Text>
                {item.quadras !== undefined && (
                  <Text style={estilos.subInfo}>{item.quadras} quadra{item.quadras !== 1 ? 's' : ''}</Text>
                )}
              </View>
              <View style={estilos.acoesCard}>
                <TouchableOpacity
                  style={estilos.botaoEditar}
                  onPress={() => navegacao.navigate('FormularioEsporte', { esporte: item })}
                >
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={estilos.botaoExcluir}
                  onPress={() => aoExcluir(item)}
                >
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={estilos.centralizado}>
              <Text style={estilos.textoVazio}>Nenhum esporte cadastrado</Text>
              <TouchableOpacity
                style={estilos.botaoCadastrar}
                onPress={() => navegacao.navigate('FormularioEsporte', { esporte: null })}
              >
                <Text style={estilos.textoBotaoCadastrar}>Cadastrar primeiro esporte</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  tituloCabecalho: { ...Tipografia.titulo2 },
  botaoAdicionar: {
    backgroundColor: Cores.primaria,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  textoBotaoAdicionar: { color: Cores.texto, fontWeight: '700', fontSize: 14 },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: Espacamento.xxl },
  lista: { padding: Espacamento.md, paddingBottom: Espacamento.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.sm,
    marginBottom: Espacamento.sm,
    borderWidth: 1,
    borderColor: Cores.borda,
    gap: 12,
  },
  imagemCard: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: Cores.fundoInput,
  },
  infoCard: { flex: 1 },
  nomeEsporte: { color: Cores.texto, fontSize: 16, fontWeight: '700' },
  subInfo: { color: Cores.textoSecundario, fontSize: 13, marginTop: 3 },
  acoesCard: { flexDirection: 'row', gap: 8 },
  botaoEditar: {
    width: 38,
    height: 38,
    backgroundColor: Cores.fundoInput,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoExcluir: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoVazio: { ...Tipografia.corpoPequeno },
  botaoCadastrar: {
    backgroundColor: Cores.primaria,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  textoBotaoCadastrar: { color: Cores.texto, fontWeight: '600' },
});

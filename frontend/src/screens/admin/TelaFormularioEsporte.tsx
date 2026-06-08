import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../shared/api';
import { Esporte } from '../../shared/tipos';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Botao } from '../../componentes/Botao';
import { Cabecalho } from '../../componentes/Cabecalho';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

async function salvarEsporte(dados: Partial<Esporte> & { id?: string }): Promise<Esporte> {
  if (dados.id) {
    const r = await api.put(`/esportes/${dados.id}`, dados);
    return r.data;
  }
  const r = await api.post('/esportes', dados);
  return r.data;
}

export function TelaFormularioEsporte() {
  const navegacao = useNavigation<any>();
  const rota = useRoute<any>();
  const esporteExistente: Esporte | null = rota.params?.esporte || null;
  const queryClient = useQueryClient();

  const [nome, setNome] = useState(esporteExistente?.nome_esporte || '');
  const [imagem, setImagem] = useState<string>(esporteExistente?.imagem_url || '');
  const [precoPart, setPrecoPart] = useState(esporteExistente?.preco_partir || '');
  const [erros, setErros] = useState<Record<string, string>>({});

  const mutacao = useMutation({
    mutationFn: salvarEsporte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esportes'] });
      Alert.alert('Sucesso', esporteExistente ? 'Esporte atualizado!' : 'Esporte criado!');
      navegacao.goBack();
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  async function aoSelecionarImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function aoSalvar() {
    if (!validar()) return;
    mutacao.mutate({
      id: esporteExistente?.id,
      nome_esporte: nome.trim(),
      imagem_url: imagem,
      preco_partir: precoPart,
    });
  }

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo={esporteExistente ? 'Editar Esporte' : 'Novo Esporte'}
        onVoltar={() => navegacao.goBack()}
      />
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Preview da imagem */}
        <TouchableOpacity style={estilos.containerImagem} onPress={aoSelecionarImagem}>
          {imagem ? (
            <Image source={{ uri: imagem }} style={estilos.imagemPreview} resizeMode="cover" />
          ) : (
            <View style={estilos.placeholderImagem}>
              <Text style={estilos.iconeImagem}>📷</Text>
              <Text style={estilos.textoImagem}>Toque para adicionar foto de capa</Text>
            </View>
          )}
          <View style={estilos.overlayImagem}>
            <Text style={estilos.textoOverlay}>Alterar imagem</Text>
          </View>
        </TouchableOpacity>

        <CampoTexto
          label="Nome do esporte *"
          placeholder="Ex: Beach Tennis"
          value={nome}
          onChangeText={setNome}
          erro={erros.nome}
        />
        <CampoTexto
          label="Preço a partir de"
          placeholder="Ex: R$ 90/h"
          value={precoPart}
          onChangeText={setPrecoPart}
        />

        <View style={estilos.rodape}>
          <Botao
            titulo={esporteExistente ? 'Salvar alterações' : 'Cadastrar esporte'}
            onPress={aoSalvar}
            carregando={mutacao.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { padding: Espacamento.md, paddingBottom: 40 },
  containerImagem: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Espacamento.lg,
    backgroundColor: Cores.fundoInput,
    borderWidth: 2,
    borderColor: Cores.borda,
    borderStyle: 'dashed',
  },
  imagemPreview: { width: '100%', height: '100%' },
  placeholderImagem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  iconeImagem: { fontSize: 40 },
  textoImagem: { color: Cores.textoSecundario, fontSize: 14, textAlign: 'center' },
  overlayImagem: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  textoOverlay: { color: Cores.texto, fontSize: 13, fontWeight: '600' },
  rodape: { marginTop: Espacamento.lg },
});

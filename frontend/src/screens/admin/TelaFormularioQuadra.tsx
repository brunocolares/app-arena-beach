import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../shared/api";
import { Quadra, Esporte } from "../../shared/tipos";
import { CampoTexto } from "../../componentes/CampoTexto";
import { Botao } from "../../componentes/Botao";
import { Cabecalho } from "../../componentes/Cabecalho";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";

async function buscarEsportes(): Promise<Esporte[]> {
  const r = await api.get("/esportes");
  return r.data;
}

async function salvarQuadra(
  dados: Partial<Quadra> & { id?: string },
): Promise<Quadra> {
  if (dados.id) {
    const r = await api.put(`/quadras/${dados.id}`, dados);
    return r.data;
  }
  const r = await api.post("/quadras", dados);
  return r.data;
}

export function TelaFormularioQuadra() {
  const navegacao = useNavigation<any>();
  const rota = useRoute<any>();
  const quadraExistente: Quadra | null = rota.params?.quadra || null;
  const queryClient = useQueryClient();

  const [nome, setNome] = useState(quadraExistente?.nome_quadra || "");
  const [preco, setPreco] = useState(
    quadraExistente ? String(quadraExistente.preco_hora) : "",
  );
  const [esportesIds, setEsportesIds] = useState<string[]>(
    quadraExistente?.esportes_ids?.length
      ? quadraExistente.esportes_ids
      : quadraExistente?.esporte_id
        ? [quadraExistente.esporte_id]
        : [],
  );
  const [fotos, setFotos] = useState<string[]>(quadraExistente?.fotos || []);
  const [diferenciais, setDiferenciais] = useState<string[]>(
    quadraExistente?.diferenciais || [],
  );
  const [novoDiferencial, setNovoDiferencial] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const { data: esportes } = useQuery({
    queryKey: ["esportes"],
    queryFn: buscarEsportes,
  });

  const mutacao = useMutation({
    mutationFn: salvarQuadra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quadras-admin"] });
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
      queryClient.invalidateQueries({ queryKey: ["esportes"] });
      Alert.alert(
        "Sucesso",
        quadraExistente ? "Quadra atualizada!" : "Quadra criada!",
      );
      navegacao.goBack();
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  async function aoSelecionarFotos() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão negada",
        "Permita o acesso à galeria para adicionar fotos.",
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: false,
    });
    if (!resultado.canceled) {
      const novasUris = resultado.assets.map((a) => a.uri);
      setFotos((prev) => [...prev, ...novasUris]);
    }
  }

  function aoRemoverFoto(uri: string) {
    setFotos((prev) => prev.filter((f) => f !== uri));
  }

  function aoAdicionarDiferencial() {
    if (novoDiferencial.trim()) {
      setDiferenciais((prev) => [...prev, novoDiferencial.trim()]);
      setNovoDiferencial("");
    }
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome é obrigatório";
    if (!preco || isNaN(Number(preco))) e.preco = "Preço inválido";
    if (esportesIds.length === 0) e.esporte = "Selecione pelo menos um esporte";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function aoSalvar() {
    if (!validar()) return;
    mutacao.mutate({
      id: quadraExistente?.id,
      nome_quadra: nome.trim(),
      preco_hora: Number(preco),
      esportes_ids: esportesIds,
      fotos,
      diferenciais,
      ativa: quadraExistente?.ativa ?? true,
    });
  }

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo={quadraExistente ? "Editar Quadra" : "Nova Quadra"}
        onVoltar={() => navegacao.goBack()}
      />

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <CampoTexto
          label="Nome da quadra *"
          placeholder="Ex: Beach Court A"
          value={nome}
          onChangeText={setNome}
          erro={erros.nome}
        />
        <CampoTexto
          label="Preço por hora (R$) *"
          placeholder="Ex: 90"
          keyboardType="numeric"
          value={preco}
          onChangeText={setPreco}
          erro={erros.preco}
        />

        {/* Seletor de Esporte */}
        <Text style={estilos.labelInput}>Esportes *</Text>
        <View style={estilos.containerEsportes}>
          {(esportes || []).map((e) => {
            const selecionado = esportesIds.includes(e.id);
            return (
              <TouchableOpacity
                key={e.id}
                style={[
                  estilos.cardEsporte,
                  selecionado && estilos.cardEsporteAtivo,
                ]}
                onPress={() => {
                  setEsportesIds((prev) =>
                    prev.includes(e.id)
                      ? prev.filter((id) => id !== e.id)
                      : [...prev, e.id],
                  );
                }}
              >
                <Text
                  style={[
                    estilos.textoEsporte,
                    selecionado && { color: Cores.texto },
                  ]}
                >
                  {e.nome_esporte}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {erros.esporte ? (
          <Text style={estilos.textoErro}>{erros.esporte}</Text>
        ) : null}

        {/* Fotos */}
        <View style={estilos.secao}>
          <Text style={estilos.labelSecao}>Fotos da quadra</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {fotos.map((uri, idx) => (
              <View key={idx} style={estilos.containerFoto}>
                <Image source={{ uri }} style={estilos.foto} />
                <TouchableOpacity
                  style={estilos.botaoRemoverFoto}
                  onPress={() => aoRemoverFoto(uri)}
                >
                  <Text style={estilos.textoRemoverFoto}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={estilos.botaoAdicionarFoto}
              onPress={aoSelecionarFotos}
            >
              <Text style={estilos.iconeAddFoto}>📷</Text>
              <Text style={estilos.textoAddFoto}>Adicionar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Diferenciais */}
        <View style={estilos.secao}>
          <Text style={estilos.labelSecao}>Diferenciais</Text>
          <View style={estilos.adicionarDiferencial}>
            <CampoTexto
              label=""
              placeholder="Ex: Coberta, LED, Vestiário..."
              value={novoDiferencial}
              onChangeText={setNovoDiferencial}
              containerStyle={{ flex: 1 }}
            />
            <TouchableOpacity
              style={estilos.botaoAddTag}
              onPress={aoAdicionarDiferencial}
            >
              <Text style={estilos.textoAddTag}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={estilos.tagContainer}>
            {diferenciais.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={estilos.tag}
                onPress={() =>
                  setDiferenciais((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <Text style={estilos.textoTag}>{d} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.rodape}>
          <Botao
            titulo={quadraExistente ? "Salvar alterações" : "Cadastrar quadra"}
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
  labelInput: {
    color: Cores.textoSecundario,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  containerEsportes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Espacamento.md,
  },
  cardEsporte: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Cores.fundoInput,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  cardEsporteAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  textoEsporte: { color: Cores.textoSecundario, fontSize: 14 },
  textoErro: {
    color: Cores.erro,
    fontSize: 12,
    marginTop: -8,
    marginBottom: Espacamento.md,
  },
  secao: { marginBottom: Espacamento.lg },
  labelSecao: { ...Tipografia.titulo3, marginBottom: Espacamento.sm },
  containerFoto: { position: "relative", marginRight: 8 },
  foto: { width: 100, height: 100, borderRadius: 10 },
  botaoRemoverFoto: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Cores.erro,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  textoRemoverFoto: { color: Cores.texto, fontSize: 12, fontWeight: "700" },
  botaoAdicionarFoto: {
    width: 100,
    height: 100,
    backgroundColor: Cores.fundoInput,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Cores.borda,
    borderStyle: "dashed",
    gap: 4,
  },
  iconeAddFoto: { fontSize: 24 },
  textoAddFoto: { color: Cores.textoSecundario, fontSize: 12 },
  adicionarDiferencial: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  botaoAddTag: {
    width: 44,
    height: 44,
    backgroundColor: Cores.primaria,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Espacamento.md,
  },
  textoAddTag: { color: Cores.texto, fontSize: 24, fontWeight: "700" },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: Cores.fundoInput,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  textoTag: { color: Cores.textoSecundario, fontSize: 13 },
  rodape: { marginTop: Espacamento.lg },
});

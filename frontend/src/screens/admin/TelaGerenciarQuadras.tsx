import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../shared/api";
import { Quadra } from "../../shared/tipos";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";
import { AntDesign } from "@expo/vector-icons";

async function buscarTodasQuadras(): Promise<Quadra[]> {
  const resposta = await api.get("/quadras");
  return resposta.data;
}

async function alternarAtivacao(id: string, ativa: boolean): Promise<void> {
  await api.patch(`/quadras/${id}`, { ativa: !ativa });
}

export function TelaGerenciarQuadras() {
  const insets = useSafeAreaInsets();
  const navegacao = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: quadras, isLoading } = useQuery({
    queryKey: ["quadras-admin"],
    queryFn: buscarTodasQuadras,
  });

  const mutacaoAlternar = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      alternarAtivacao(id, ativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quadras-admin"] });
      queryClient.invalidateQueries({ queryKey: ["esportes"] });
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Gerenciar Quadras</Text>
        <TouchableOpacity
          style={estilos.botaoAdicionar}
          onPress={() =>
            navegacao.navigate("FormularioQuadra", { quadra: null })
          }
        >
          <Text style={estilos.textoBotaoAdicionar}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
        </View>
      ) : (
        <FlatList
          data={quadras}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={estilos.card}>
              <View style={estilos.linhaCard}>
                <View
                  style={[
                    estilos.dotStatus,
                    item.ativa ? estilos.dotAtiva : estilos.dotInativa,
                  ]}
                />
                <View style={estilos.infoCard}>
                  <Text style={estilos.nomeQuadra}>{item.nome_quadra}</Text>
                  <Text style={estilos.precoQuadra}>
                    R$ {item.preco_hora}/h
                  </Text>
                </View>
                <View style={estilos.acoesCard}>
                  <TouchableOpacity
                    style={estilos.botaoEditar}
                    onPress={() =>
                      navegacao.navigate("FormularioQuadra", { quadra: item })
                    }
                  >
                    <AntDesign name="edit" size={24} color={Cores.texto} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      estilos.botaoToggle,
                      item.ativa ? estilos.botaoDesativar : estilos.botaoAtivar,
                    ]}
                    onPress={() =>
                      mutacaoAlternar.mutate({ id: item.id, ativa: item.ativa })
                    }
                  >
                    <Text style={estilos.textoToggle}>
                      {item.ativa ? "Desativar" : "Ativar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {item.diferenciais && item.diferenciais.length > 0 && (
                <View style={estilos.tagContainer}>
                  {item.diferenciais.slice(0, 3).map((tag, i) => (
                    <View key={i} style={estilos.tag}>
                      <Text style={estilos.textoTag}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={estilos.centralizado}>
              <Text style={estilos.textoVazio}>Nenhuma quadra cadastrada</Text>
              <TouchableOpacity
                style={estilos.botaoCadastrar}
                onPress={() =>
                  navegacao.navigate("FormularioQuadra", { quadra: null })
                }
              >
                <Text style={estilos.textoBotaoCadastrar}>
                  Cadastrar primeira quadra
                </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  textoBotaoAdicionar: { color: Cores.texto, fontWeight: "700", fontSize: 14 },
  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  lista: { padding: Espacamento.md, paddingBottom: Espacamento.xxl },
  card: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.md,
    marginBottom: Espacamento.sm,
    borderWidth: 1,
    borderColor: Cores.borda,
    gap: 10,
  },
  linhaCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  dotStatus: { width: 10, height: 10, borderRadius: 5 },
  dotAtiva: { backgroundColor: Cores.sucesso },
  dotInativa: { backgroundColor: Cores.erro },
  infoCard: { flex: 1 },
  nomeQuadra: { color: Cores.texto, fontSize: 15, fontWeight: "700" },
  precoQuadra: { color: Cores.primaria, fontSize: 13, marginTop: 2 },
  acoesCard: { flexDirection: "row", gap: 8, alignItems: "center" },
  botaoEditar: {
    width: 36,
    height: 36,
    backgroundColor: Cores.fundoInput,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotaoEditar: { fontSize: 16 },
  botaoToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  botaoAtivar: {
    backgroundColor: "rgba(76,175,80,0.2)",
    borderWidth: 1,
    borderColor: Cores.sucesso,
  },
  botaoDesativar: {
    backgroundColor: "rgba(255,82,82,0.15)",
    borderWidth: 1,
    borderColor: Cores.erro,
  },
  textoToggle: { color: Cores.texto, fontSize: 12, fontWeight: "600" },
  tagContainer: { flexDirection: "row", gap: 6 },
  tag: {
    backgroundColor: Cores.fundoInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  textoTag: { color: Cores.textoSecundario, fontSize: 11 },
  textoVazio: { ...Tipografia.corpoPequeno },
  botaoCadastrar: {
    backgroundColor: Cores.primaria,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  textoBotaoCadastrar: { color: Cores.texto, fontWeight: "600" },
});

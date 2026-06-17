import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../shared/api";
import { Esporte } from "../../shared/tipos";
import { CardEsporte } from "../../componentes/CardEsporte";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";
import { HomeStackParams } from "../../routes/ClienteTabs";
import { useAuth } from "../../contexto/AuthContexto";

type NavProp = NativeStackNavigationProp<HomeStackParams, "Home">;

async function buscarEsportes(): Promise<Esporte[]> {
  const resposta = await api.get("/esportes");
  return resposta.data;
}

export function TelaHome() {
  const navegacao = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { autenticado, usuario } = useAuth();

  const {
    data: esportes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["esportes"],
    queryFn: buscarEsportes,
    refetchOnMount: true,
  });

  function aoSelecionarEsporte(esporte: Esporte) {
    navegacao.navigate("Quadras", { esporte });
  }

  if (isLoading) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <ActivityIndicator size="large" color={Cores.primaria} />
        <Text style={estilos.textoCarregando}>Carregando modalidades...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <Text style={estilos.textoErro}>Erro ao carregar esportes</Text>
        <TouchableOpacity onPress={() => refetch()} style={estilos.botaoTentar}>
          <Text style={estilos.textoBotaoTentar}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={estilos.header}>
        <View>
          <Text style={estilos.logoTexto}>Arena Pulse</Text>
          <Text style={estilos.subTitulo}>Escolha a modalidade</Text>
        </View>
        <View style={estilos.badgeOnline}>
          <Text style={estilos.textoBadgeOnline}>● Aberto</Text>
        </View>
      </View>

      {/* Banner de destaque */}
      <View style={estilos.banner}>
        <Text style={estilos.bannerTexto}>
          {autenticado
            ? `Olá, ${usuario?.nome ? usuario.nome.split(" ")[0] : ""}!`
            : "Reserve sua quadra em segundos!"}
        </Text>
        {!autenticado && (
          <Text style={estilos.bannerSub}>
            Confira disponibilidade sem precisar fazer login
          </Text>
        )}
      </View>

      {/* Grid de esportes */}
      <FlatList
        data={esportes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={estilos.lista}
        columnWrapperStyle={estilos.coluna}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={estilos.secaoTitulo}>Modalidades disponíveis</Text>
        }
        renderItem={({ item }) => (
          <CardEsporte
            esporte={item}
            onPress={() => aoSelecionarEsporte(item)}
          />
        )}
        ListEmptyComponent={
          <View style={estilos.centralizado}>
            <Text style={estilos.textoVazio}>
              Nenhuma modalidade cadastrada
            </Text>
          </View>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo,
  },
  centralizado: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  logoTexto: {
    fontSize: 22,
    fontWeight: "800",
    color: Cores.primaria,
    letterSpacing: 0.5,
  },
  subTitulo: {
    ...Tipografia.corpoPequeno,
    marginTop: 2,
  },
  badgeOnline: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Cores.sucesso,
  },
  textoBadgeOnline: {
    color: Cores.sucesso,
    fontSize: 12,
    fontWeight: "600",
  },
  banner: {
    backgroundColor: Cores.primariaDark,
    marginHorizontal: Espacamento.md,
    marginTop: Espacamento.md,
    borderRadius: 14,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.primaria,
  },
  bannerTexto: {
    color: Cores.texto,
    fontSize: 15,
    fontWeight: "700",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 4,
  },
  lista: {
    paddingHorizontal: Espacamento.md,
    paddingBottom: Espacamento.xxl,
  },
  coluna: {
    justifyContent: "space-between",
  },
  secaoTitulo: {
    ...Tipografia.titulo3,
    marginTop: Espacamento.lg,
    marginBottom: Espacamento.md,
  },
  textoCarregando: {
    ...Tipografia.corpoPequeno,
    marginTop: Espacamento.sm,
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
  textoBotaoTentar: {
    color: Cores.texto,
    fontWeight: "600",
  },
  textoVazio: {
    ...Tipografia.corpoPequeno,
  },
});

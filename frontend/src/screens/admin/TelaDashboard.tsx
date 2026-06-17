import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexto/AuthContexto";
import { api } from "../../shared/api";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";
import AntDesign from "@expo/vector-icons/build/AntDesign";

const { width } = Dimensions.get("window");

// ─── Tipos ────────────────────────────────────────────────
interface DadosDashboard {
  periodo: { inicio: string; fim: string };
  cartoes: {
    faturamentoPeriodo: number;
    faturamentoHoje: number;
    reservasHoje: number;
    reservasPeriodo: number;
    totalQuadras: number;
    totalEsportes: number;
    totalUsuarios: number;
  };
  rankingEsportes: { nome: string; total: number }[];
  rankingHorarios: { horario: string; total: number }[];
  rankingQuadras: { nome: string; total: number; faturamento: number }[];
  rankingDias: { dia: string; total: number }[];
  ultimos7Dias: { data: string; total: number; faturamento: number }[];
}

type FiltroTempo = "semana" | "mes" | "hoje";

function obterPeriodo(filtro: FiltroTempo): { inicio: string; fim: string } {
  const hoje = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (filtro === "hoje") {
    const s = fmt(hoje);
    return { inicio: s, fim: s };
  }
  if (filtro === "semana") {
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 6);
    return { inicio: fmt(inicio), fim: fmt(hoje) };
  }
  // mes
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-31` };
}

async function buscarDashboard(
  inicio: string,
  fim: string,
): Promise<DadosDashboard> {
  const r = await api.get(
    `/admin/dashboard?data_inicio=${inicio}&data_fim=${fim}`,
  );
  return r.data;
}

function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Componentes Internos ─────────────────────────────────

function CartaoMetrica({
  icone,
  titulo,
  valor,
  subtitulo,
  corDestaque,
}: {
  icone: string;
  titulo: string;
  valor: string;
  subtitulo?: string;
  corDestaque?: string;
}) {
  return (
    <View
      style={[
        estilos.cartao,
        { borderLeftColor: corDestaque || Cores.primaria, borderLeftWidth: 3 },
      ]}
    >
      <Text style={estilos.cartaoIcone}>{icone}</Text>
      <Text style={estilos.cartaoValor}>{valor}</Text>
      <Text style={estilos.cartaoTitulo}>{titulo}</Text>
      {subtitulo ? <Text style={estilos.cartaoSub}>{subtitulo}</Text> : null}
    </View>
  );
}

function SecaoRanking({
  titulo,
  icone,
  dados,
  formatarValor,
}: {
  titulo: string;
  icone: string;
  dados: { label: string; valor: number; sub?: string }[];
  formatarValor?: (v: number) => string;
}) {
  const maxValor = dados[0]?.valor || 1;
  return (
    <View style={estilos.secao}>
      <View style={estilos.secaoHeader}>
        <Text style={estilos.secaoIcone}>{icone}</Text>
        <Text style={estilos.secaoTitulo}>{titulo}</Text>
      </View>
      {dados.length === 0 ? (
        <Text style={estilos.textoVazio}>Sem dados no período</Text>
      ) : (
        dados.map((item, idx) => (
          <View key={idx} style={estilos.itemRanking}>
            <View style={estilos.itemRankingInfo}>
              <View style={estilos.itemRankingTopo}>
                <View
                  style={[
                    estilos.posicaoBadge,
                    idx === 0
                      ? estilos.posicaoOuro
                      : idx === 1
                        ? estilos.posicaoPrata
                        : estilos.posicaoBronze,
                  ]}
                >
                  <Text style={estilos.posicaoTexto}>{idx + 1}º</Text>
                </View>
                <Text style={estilos.itemLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={estilos.itemValor}>
                  {formatarValor ? formatarValor(item.valor) : `${item.valor}x`}
                </Text>
              </View>
              {item.sub ? (
                <Text style={estilos.itemSub}>{item.sub}</Text>
              ) : null}
              {/* Barra de progresso */}
              <View style={estilos.barraFundo}>
                <View
                  style={[
                    estilos.barraPreenchida,
                    {
                      width: `${(item.valor / maxValor) * 100}%`,
                      backgroundColor: idx === 0 ? Cores.primaria : Cores.borda,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function GraficoBarras({
  dados,
}: {
  dados: { data: string; total: number; faturamento: number }[];
}) {
  const maxFat = Math.max(...dados.map((d) => d.faturamento), 1);
  const barWidth = (width - Espacamento.md * 4) / dados.length - 6;

  return (
    <View style={estilos.secao}>
      <View style={estilos.secaoHeader}>
        <Text style={estilos.secaoIcone}>📊</Text>
        <Text style={estilos.secaoTitulo}>Faturamento — últimos 7 dias</Text>
      </View>
      <View style={estilos.graficoContainer}>
        {dados.map((d, i) => {
          const altura =
            maxFat > 0
              ? Math.max(
                  (d.faturamento / maxFat) * 90,
                  d.faturamento > 0 ? 6 : 2,
                )
              : 2;
          const ehHoje = i === dados.length - 1;
          return (
            <View key={i} style={[estilos.barra, { width: barWidth }]}>
              {d.faturamento > 0 && (
                <Text style={estilos.barraValorTopo} numberOfLines={1}>
                  {formatarReal(d.faturamento).replace("R$\u00a0", "")}
                </Text>
              )}
              <View
                style={[
                  estilos.barraColuna,
                  {
                    height: altura,
                    backgroundColor: ehHoje ? Cores.primaria : "#3a3a5c",
                  },
                ]}
              />
              <Text
                style={[
                  estilos.barraLabel,
                  ehHoje && { color: Cores.primaria },
                ]}
              >
                {d.data}
              </Text>
              {d.total > 0 && (
                <Text style={estilos.barraCount}>{d.total}r</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tela Principal ───────────────────────────────────────

export function TelaDashboard() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<FiltroTempo>("mes");

  const periodo = obterPeriodo(filtro);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", filtro],
    queryFn: () => buscarDashboard(periodo.inicio, periodo.fim),
    staleTime: 1000 * 60 * 2,
  });

  const nomeFiltro = {
    hoje: "Hoje",
    semana: "Últimos 7 dias",
    mes: "Este mês",
  };

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <View>
          <Text style={estilos.tituloCabecalho}>Dashboard</Text>
          <Text style={estilos.subtituloCabecalho}>
            Olá, {usuario?.nome?.split(" ")[0]}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          style={estilos.botaoAtualizar}
        >
          <AntDesign
            name="reload1"
            size={18}
            color={Cores.primaria}
            style={estilos.iconeAtualizar}
          />
        </TouchableOpacity>
      </View>

      {/* Filtros de tempo */}
      <View style={estilos.filtros}>
        {(["hoje", "semana", "mes"] as FiltroTempo[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              estilos.botaoFiltro,
              filtro === f && estilos.botaoFiltroAtivo,
            ]}
            onPress={() => setFiltro(f)}
          >
            <Text
              style={[
                estilos.textoFiltro,
                filtro === f && estilos.textoFiltroAtivo,
              ]}
            >
              {nomeFiltro[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
          <Text style={estilos.textoCarregando}>Carregando dados...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={estilos.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Cores.primaria}
            />
          }
        >
          {/* Cartões principais */}
          <View style={estilos.gridCartoes}>
            <CartaoMetrica
              icone="💰"
              titulo="Faturamento"
              valor={formatarReal(data?.cartoes.faturamentoPeriodo || 0)}
              subtitulo={nomeFiltro[filtro]}
              corDestaque={Cores.sucesso}
            />
            <CartaoMetrica
              icone="📅"
              titulo="Reservas"
              valor={String(data?.cartoes.reservasPeriodo || 0)}
              subtitulo={nomeFiltro[filtro]}
              corDestaque={Cores.primaria}
            />
            <CartaoMetrica
              icone="🌅"
              titulo="Hoje"
              valor={formatarReal(data?.cartoes.faturamentoHoje || 0)}
              subtitulo={`${data?.cartoes.reservasHoje || 0} reservas`}
              corDestaque={Cores.aviso}
            />
            <CartaoMetrica
              icone="🏟️"
              titulo="Quadras"
              valor={String(data?.cartoes.totalQuadras || 0)}
              subtitulo="ativas"
              corDestaque="#9c59ff"
            />
            <CartaoMetrica
              icone="⚽"
              titulo="Esportes"
              valor={String(data?.cartoes.totalEsportes || 0)}
              subtitulo="modalidades"
              corDestaque="#ff6b9d"
            />
            <CartaoMetrica
              icone="👥"
              titulo="Clientes"
              valor={String(data?.cartoes.totalUsuarios || 0)}
              subtitulo="cadastrados"
              corDestaque="#4ecdc4"
            />
          </View>

          {/* Gráfico de barras */}
          {data?.ultimos7Dias && <GraficoBarras dados={data.ultimos7Dias} />}

          {/* Rankings */}
          <SecaoRanking
            titulo="Esportes mais reservados"
            icone="🏆"
            dados={(data?.rankingEsportes || []).map((e) => ({
              label: e.nome,
              valor: e.total,
            }))}
          />

          <SecaoRanking
            titulo="Quadras mais alugadas"
            icone="🥇"
            dados={(data?.rankingQuadras || []).map((q) => ({
              label: q.nome,
              valor: q.total,
              sub: formatarReal(q.faturamento),
            }))}
          />

          <SecaoRanking
            titulo="Horários mais procurados"
            icone="🕐"
            dados={(data?.rankingHorarios || []).map((h) => ({
              label: h.horario,
              valor: h.total,
            }))}
          />

          <SecaoRanking
            titulo="Dias da semana mais movimentados"
            icone="📆"
            dados={(data?.rankingDias || []).map((d) => ({
              label: d.dia,
              valor: d.total,
            }))}
          />

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────
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
  subtituloCabecalho: { ...Tipografia.corpoPequeno, marginTop: 2 },
  botaoAtualizar: {
    width: 40,
    height: 40,
    backgroundColor: Cores.fundoInput,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconeAtualizar: { fontSize: 18 },

  filtros: {
    flexDirection: "row",
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.sm,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
    gap: 8,
  },
  botaoFiltro: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Cores.fundoInput,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  botaoFiltroAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  textoFiltro: {
    color: Cores.textoSecundario,
    fontSize: 13,
    fontWeight: "500",
  },
  textoFiltroAtivo: { color: Cores.texto, fontWeight: "700" },

  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  textoCarregando: { ...Tipografia.corpoPequeno },
  scroll: { padding: Espacamento.md },

  // Grid de cartões (2 colunas)
  gridCartoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Espacamento.sm,
    marginBottom: Espacamento.md,
  },
  cartao: {
    width: (width - Espacamento.md * 2 - Espacamento.sm) / 2,
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
    gap: 4,
  },
  cartaoIcone: { fontSize: 22 },
  cartaoValor: {
    color: Cores.texto,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  cartaoTitulo: {
    color: Cores.textoSecundario,
    fontSize: 12,
    fontWeight: "600",
  },
  cartaoSub: { color: Cores.textoSecundario, fontSize: 11 },

  // Gráfico de barras
  graficoContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingTop: Espacamento.lg,
  },
  barra: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  barraValorTopo: {
    color: Cores.textoSecundario,
    fontSize: 8,
    textAlign: "center",
  },
  barraColuna: {
    width: "80%",
    borderRadius: 4,
    minHeight: 2,
  },
  barraLabel: {
    color: Cores.textoSecundario,
    fontSize: 9,
    textAlign: "center",
  },
  barraCount: {
    color: Cores.primaria,
    fontSize: 9,
    fontWeight: "700",
  },

  // Seção de ranking
  secao: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 16,
    padding: Espacamento.md,
    marginBottom: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Espacamento.md,
  },
  secaoIcone: { fontSize: 20 },
  secaoTitulo: { ...Tipografia.titulo3 },

  textoVazio: {
    ...Tipografia.corpoPequeno,
    textAlign: "center",
    paddingVertical: 8,
  },

  itemRanking: { marginBottom: 10 },
  itemRankingInfo: { gap: 4 },
  itemRankingTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  posicaoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  posicaoOuro: { backgroundColor: "#FFD700" },
  posicaoPrata: { backgroundColor: "#C0C0C0" },
  posicaoBronze: { backgroundColor: "#CD7F32" },
  posicaoTexto: { fontSize: 10, fontWeight: "800", color: "#1a1a1a" },
  itemLabel: { flex: 1, color: Cores.texto, fontSize: 14, fontWeight: "600" },
  itemValor: { color: Cores.primaria, fontSize: 13, fontWeight: "700" },
  itemSub: { color: Cores.textoSecundario, fontSize: 12, marginLeft: 32 },
  barraFundo: {
    height: 4,
    backgroundColor: Cores.fundoInput,
    borderRadius: 2,
    marginLeft: 32,
    marginTop: 2,
    overflow: "hidden",
  },
  barraPreenchida: { height: "100%", borderRadius: 2 },
});

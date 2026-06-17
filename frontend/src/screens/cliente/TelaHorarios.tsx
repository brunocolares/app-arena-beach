import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { SlotHorario } from "../../shared/tipos";
import { Cabecalho } from "../../componentes/Cabecalho";
import { Botao } from "../../componentes/Botao";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";
import { HomeStackParams } from "../../routes/ClienteTabs";

type NavProp = NativeStackNavigationProp<HomeStackParams, "Horarios">;
type RotaProp = RouteProp<HomeStackParams, "Horarios">;

interface DiaCalendario {
  data: string;
  label: string;
  diaNum: string;
}

function gerarProximosDias(quantidade: number): DiaCalendario[] {
  const dias: DiaCalendario[] = [];
  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  // Usa ano/mes/dia local para não sofrer impacto do timezone (evita virar "amanhã" após 21h)
  const agora = new Date();
  const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate() + i,
    );
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const dataStr = `${ano}-${mes}-${dia}`;
    dias.push({
      data: dataStr,
      label: dataStr === hojeStr ? "Hoje" : nomesDias[d.getDay()],
      diaNum: dia,
    });
  }
  return dias;
}

async function buscarHorariosDisponiveis(
  quadraId: string,
  data: string,
): Promise<SlotHorario[]> {
  const r = await api.get(
    `/horarios-disponiveis?quadra_id=${quadraId}&data=${data}`,
  );
  return r.data;
}

// Converte "HH:MM" em minutos para facilitar comparação
function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// Verifica se dois horários são consecutivos (diferença = 60 min)
function saoConsecutivos(h1: string, h2: string): boolean {
  return Math.abs(horaParaMinutos(h2) - horaParaMinutos(h1)) === 60;
}

// Dado o bloco selecionado, retorna hora de início e fim do bloco inteiro
function calcularBlocoHorario(horarios: string[]): {
  inicio: string;
  fim: string;
} {
  const ordenados = [...horarios].sort(
    (a, b) => horaParaMinutos(a) - horaParaMinutos(b),
  );
  const inicio = ordenados[0];
  const ultimoH = ordenados[ordenados.length - 1];
  const [h, m] = ultimoH.split(":").map(Number);
  const fim = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { inicio, fim };
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function TelaHorarios() {
  const navegacao = useNavigation<NavProp>();
  const rota = useRoute<RotaProp>();
  const { quadra } = rota.params;

  const dias = gerarProximosDias(14);
  const [diaSelecionado, setDiaSelecionado] = useState<DiaCalendario>(dias[0]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(
    [],
  );

  const { data: slots, isLoading } = useQuery({
    queryKey: ["horarios", quadra.id, diaSelecionado.data],
    queryFn: () => buscarHorariosDisponiveis(quadra.id, diaSelecionado.data),
  });

  function aoSelecionarDia(dia: DiaCalendario) {
    setDiaSelecionado(dia);
    setHorariosSelecionados([]);
  }

  function aoTocarSlot(horario: string) {
    // Já está selecionado → desmarcar
    if (horariosSelecionados.includes(horario)) {
      // Só pode desmarcar se for a primeira ou última da sequência
      const ordenados = [...horariosSelecionados].sort(
        (a, b) => horaParaMinutos(a) - horaParaMinutos(b),
      );
      const ePrimeiro = horario === ordenados[0];
      const eUltimo = horario === ordenados[ordenados.length - 1];
      if (ePrimeiro || eUltimo) {
        setHorariosSelecionados((prev) => prev.filter((h) => h !== horario));
      } else {
        Alert.alert(
          "Atenção",
          "Só é possível remover o primeiro ou o último horário do bloco.",
        );
      }
      return;
    }

    // Nenhum selecionado ainda → selecionar o primeiro
    if (horariosSelecionados.length === 0) {
      setHorariosSelecionados([horario]);
      return;
    }

    // Verificar se o novo horário é adjacente ao bloco atual
    const ordenados = [...horariosSelecionados].sort(
      (a, b) => horaParaMinutos(a) - horaParaMinutos(b),
    );
    const primeiro = ordenados[0];
    const ultimo = ordenados[ordenados.length - 1];

    const adjacenteNoFim =
      saoConsecutivos(ultimo, horario) &&
      horaParaMinutos(horario) > horaParaMinutos(ultimo);
    const adjacenteNoInicio =
      saoConsecutivos(horario, primeiro) &&
      horaParaMinutos(horario) < horaParaMinutos(primeiro);

    if (adjacenteNoFim || adjacenteNoInicio) {
      // Verificar se o slot adjacente está disponível
      const slotInfo = (slots || []).find((s) => s.horario === horario);
      if (!slotInfo?.disponivel) {
        Alert.alert("Indisponível", "Este horário está ocupado.");
        return;
      }
      setHorariosSelecionados((prev) => [...prev, horario]);
    } else {
      Alert.alert(
        "Seleção inválida",
        "Selecione apenas horários consecutivos ao bloco atual.\nPara começar de outro horário, toque em um já selecionado para desmarcá-lo.",
      );
    }
  }

  function aoConfirmar() {
    if (horariosSelecionados.length === 0) {
      Alert.alert("Atenção", "Selecione ao menos um horário.");
      return;
    }
    const ordenados = [...horariosSelecionados].sort(
      (a, b) => horaParaMinutos(a) - horaParaMinutos(b),
    );
    navegacao.navigate("Checkout", {
      quadra,
      data: diaSelecionado.data,
      horarios: ordenados,
    });
  }

  // Calcula o total acumulado
  const totalHoras = horariosSelecionados.length;
  const totalValor = totalHoras * Number(quadra.preco_hora);

  const blocoHorario =
    horariosSelecionados.length > 0
      ? calcularBlocoHorario(horariosSelecionados)
      : null;

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo={quadra.nome_quadra}
        subtitulo="Escolha o dia e horários"
        onVoltar={() => navegacao.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.scroll}
      >
        {/* Seletor de dias */}
        <View style={estilos.secao}>
          <Text style={estilos.labelSecao}>Selecione o dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dias.map((dia) => {
              const ativo = dia.data === diaSelecionado.data;
              return (
                <TouchableOpacity
                  key={dia.data}
                  style={[estilos.cardDia, ativo && estilos.cardDiaAtivo]}
                  onPress={() => aoSelecionarDia(dia)}
                >
                  <Text
                    style={[estilos.labelDia, ativo && estilos.textoDiaAtivo]}
                  >
                    {dia.label}
                  </Text>
                  <Text
                    style={[estilos.numeroDia, ativo && estilos.textoDiaAtivo]}
                  >
                    {dia.diaNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Horários */}
        <View style={estilos.secao}>
          <View style={estilos.headerSecaoHorarios}>
            <Text style={estilos.labelSecao}>Horários disponíveis</Text>
            {horariosSelecionados.length > 0 && (
              <TouchableOpacity onPress={() => setHorariosSelecionados([])}>
                <Text style={estilos.linkLimpar}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={estilos.dicaMulti}>
            Toque em horários consecutivos para reservar mais de uma hora
            seguida.
          </Text>

          {isLoading ? (
            <View style={estilos.centralizado}>
              <ActivityIndicator color={Cores.primaria} />
              <Text style={estilos.textoCarregando}>
                Verificando disponibilidade...
              </Text>
            </View>
          ) : (
            <View style={estilos.gridSlots}>
              {(slots || []).map((slot) => {
                const selecionado = horariosSelecionados.includes(slot.horario);

                // Determina se este slot é adjacente ao bloco atual (para destacar visualmente)
                const ordenados = [...horariosSelecionados].sort(
                  (a, b) => horaParaMinutos(a) - horaParaMinutos(b),
                );
                const primeiroSel = ordenados[0];
                const ultimoSel = ordenados[ordenados.length - 1];
                const ehAdjacente =
                  !selecionado &&
                  slot.disponivel &&
                  horariosSelecionados.length > 0 &&
                  ((saoConsecutivos(ultimoSel, slot.horario) &&
                    horaParaMinutos(slot.horario) >
                      horaParaMinutos(ultimoSel)) ||
                    (saoConsecutivos(slot.horario, primeiroSel) &&
                      horaParaMinutos(slot.horario) <
                        horaParaMinutos(primeiroSel)));

                return (
                  <TouchableOpacity
                    key={slot.horario}
                    style={[
                      estilos.slot,
                      !slot.disponivel && estilos.slotIndisponivel,
                      selecionado && estilos.slotAtivo,
                      ehAdjacente && estilos.slotAdjacente,
                    ]}
                    onPress={() => slot.disponivel && aoTocarSlot(slot.horario)}
                    disabled={!slot.disponivel}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        estilos.textoSlot,
                        !slot.disponivel && estilos.textoSlotIndisponivel,
                        selecionado && estilos.textoSlotAtivo,
                        ehAdjacente && estilos.textoSlotAdjacente,
                      ]}
                    >
                      {slot.horario}
                    </Text>
                    {selecionado && <Text style={estilos.iconeCheck}>✓</Text>}
                    {!slot.disponivel && (
                      <Text style={estilos.textoOcupado}>Ocupado</Text>
                    )}
                    {ehAdjacente && (
                      <Text style={estilos.textoAdjacente}>+ add</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {(!slots || slots.length === 0) && (
                <Text style={estilos.textoVazio}>
                  Nenhum horário disponível neste dia.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Resumo do bloco selecionado */}
        {horariosSelecionados.length > 0 && blocoHorario && (
          <View style={estilos.resumo}>
            <View style={estilos.resumoHeader}>
              <Text style={estilos.resumoTitulo}>Resumo da seleção</Text>
              <View style={estilos.badgeHoras}>
                <Text style={estilos.textoBadgeHoras}>{totalHoras}h</Text>
              </View>
            </View>

            <View style={estilos.separadorResumo} />

            <ItemResumo
              label="Data"
              valor={formatarData(diaSelecionado.data)}
            />
            <ItemResumo
              label="Período"
              valor={`${blocoHorario.inicio} → ${blocoHorario.fim}`}
            />
            <ItemResumo
              label={`Duração`}
              valor={`${totalHoras} hora${totalHoras > 1 ? "s" : ""}`}
            />
            <ItemResumo
              label={`R$ ${quadra.preco_hora}/h × ${totalHoras}h`}
              valor=""
              destaque
            />

            <View style={estilos.separadorResumo} />

            <View style={estilos.linhaTotalResumo}>
              <Text style={estilos.labelTotalResumo}>Total</Text>
              <Text style={estilos.valorTotalResumo}>
                R${" "}
                {totalValor.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={estilos.rodape}>
          <Botao
            titulo={
              horariosSelecionados.length === 0
                ? "Selecione um horário"
                : `Reservar ${totalHoras}h — R$ ${totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
            onPress={aoConfirmar}
            desabilitado={horariosSelecionados.length === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ItemResumo({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={estilosItem.linha}>
      <Text style={[estilosItem.label, destaque && estilosItem.labelDestaque]}>
        {label}
      </Text>
      {valor ? <Text style={estilosItem.valor}>{valor}</Text> : null}
    </View>
  );
}

const estilosItem = StyleSheet.create({
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  label: { color: Cores.textoSecundario, fontSize: 13 },
  labelDestaque: {
    color: Cores.textoSecundario,
    fontSize: 12,
    fontStyle: "italic",
  },
  valor: { color: Cores.texto, fontWeight: "600", fontSize: 14 },
});

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { paddingBottom: 40 },
  secao: { paddingHorizontal: Espacamento.md, marginTop: Espacamento.lg },
  labelSecao: { ...Tipografia.titulo3, marginBottom: Espacamento.sm },
  headerSecaoHorarios: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Espacamento.sm,
  },
  linkLimpar: { color: Cores.erro, fontSize: 13, fontWeight: "600" },
  dicaMulti: {
    color: Cores.textoSecundario,
    fontSize: 12,
    backgroundColor: Cores.fundoInput,
    padding: Espacamento.sm,
    borderRadius: 8,
    marginBottom: Espacamento.md,
    lineHeight: 18,
  },
  centralizado: {
    alignItems: "center",
    paddingVertical: Espacamento.xl,
    gap: 8,
  },
  textoCarregando: { ...Tipografia.corpoPequeno },
  // Dias
  cardDia: {
    width: 60,
    height: 70,
    backgroundColor: Cores.fundoCard,
    borderRadius: 12,
    marginRight: Espacamento.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Cores.borda,
    gap: 4,
  },
  cardDiaAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  labelDia: { color: Cores.textoSecundario, fontSize: 12, fontWeight: "500" },
  numeroDia: { color: Cores.texto, fontSize: 20, fontWeight: "700" },
  textoDiaAtivo: { color: Cores.texto },
  // Slots
  gridSlots: { flexDirection: "row", flexWrap: "wrap", gap: Espacamento.sm },
  slot: {
    width: "30%",
    backgroundColor: Cores.fundoCard,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Cores.borda,
    gap: 2,
  },
  slotAtivo: { backgroundColor: Cores.primaria, borderColor: Cores.primaria },
  slotAdjacente: {
    borderColor: Cores.primaria,
    borderStyle: "dashed",
    backgroundColor: "rgba(108,99,255,0.1)",
  },
  slotIndisponivel: { opacity: 0.35, backgroundColor: Cores.fundoInput },
  textoSlot: { color: Cores.texto, fontSize: 14, fontWeight: "600" },
  textoSlotAtivo: { color: Cores.texto },
  textoSlotAdjacente: { color: Cores.primaria },
  textoSlotIndisponivel: { color: Cores.textoSecundario },
  iconeCheck: { color: Cores.texto, fontSize: 10, fontWeight: "800" },
  textoOcupado: { color: Cores.textoSecundario, fontSize: 9, marginTop: 1 },
  textoAdjacente: { color: Cores.primaria, fontSize: 9, fontWeight: "600" },
  textoVazio: {
    ...Tipografia.corpoPequeno,
    width: "100%",
    textAlign: "center",
    paddingVertical: Espacamento.md,
  },
  // Resumo
  resumo: {
    backgroundColor: Cores.fundoCard,
    margin: Espacamento.md,
    borderRadius: 14,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.primaria,
    marginTop: Espacamento.lg,
  },
  resumoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resumoTitulo: { ...Tipografia.titulo3 },
  badgeHoras: {
    backgroundColor: Cores.primaria,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoBadgeHoras: { color: Cores.texto, fontSize: 13, fontWeight: "700" },
  separadorResumo: {
    height: 1,
    backgroundColor: Cores.borda,
    marginVertical: 6,
  },
  linhaTotalResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  labelTotalResumo: { ...Tipografia.titulo3 },
  valorTotalResumo: { color: Cores.primaria, fontSize: 22, fontWeight: "800" },
  rodape: { paddingHorizontal: Espacamento.md, marginTop: Espacamento.md },
});

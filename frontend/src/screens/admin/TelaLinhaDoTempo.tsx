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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { Reserva, Quadra } from "../../shared/tipos";
import { Cores, Espacamento, Tipografia } from "../../styles/tema";

interface SlotAgenda {
  horario: string;
  reserva?: Reserva;
  bloqueado?: boolean;
}

function gerarProximosDias(qtd: number) {
  const dias = [];
  const hoje = new Date();
  const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    dias.push({
      data: `${ano}-${mes}-${dia}`,
      label: i === 0 ? "Hoje" : nomes[d.getDay()],
      diaNum: dia,
    });
  }
  return dias;
}

function parseDateLocal(dataReserva: string, hora: string): Date {
  const [ano, mes, dia] = dataReserva.split("-").map(Number);
  const [horaNum, minutoNum] = hora.split(":").map(Number);
  return new Date(ano, mes - 1, dia, horaNum, minutoNum, 0, 0);
}

function isSlotPassado(dataReserva: string, horario: string): boolean {
  const agora = new Date();
  const dataHora = parseDateLocal(dataReserva, horario);
  return dataHora <= agora;
}

const HORARIOS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

async function buscarAgendaDiaria(
  data: string,
): Promise<{ quadras: Quadra[]; reservas: Reserva[] }> {
  const resposta = await api.get(`/admin/agenda?data=${data}`);
  return resposta.data;
}

async function criarBloqueio(dados: {
  quadra_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
}): Promise<void> {
  await api.post("/reservas/bloqueio", dados);
}

async function cancelarReserva(id: string): Promise<void> {
  await api.delete(`/reservas/${id}`);
}

export function TelaLinhaDoTempo() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const dias = gerarProximosDias(7);
  const [diaSelecionado, setDiaSelecionado] = useState(dias[0]);

  const { data: agenda, isLoading } = useQuery({
    queryKey: ["agenda-admin", diaSelecionado.data],
    queryFn: () => buscarAgendaDiaria(diaSelecionado.data),
  });

  const mutacaoBloqueio = useMutation({
    mutationFn: criarBloqueio,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agenda-admin", diaSelecionado.data],
      });
      Alert.alert("Sucesso", "Horário bloqueado com sucesso.");
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  const mutacaoCancelarReserva = useMutation({
    mutationFn: cancelarReserva,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agenda-admin", diaSelecionado.data],
      });
      Alert.alert("Sucesso", "Reserva cancelada com sucesso.");
    },
    onError: (e: Error) => Alert.alert("Erro", e.message),
  });

  function aoBloqueioPress(quadraId: string, horario: string) {
    if (isSlotPassado(diaSelecionado.data, horario)) {
      return Alert.alert(
        "Horário passado",
        "Não é possível bloquear horários que já passaram.",
      );
    }

    Alert.alert("Bloquear horário", `Bloquear ${horario} para manutenção?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Bloquear",
        style: "destructive",
        onPress: () => {
          const [h] = horario.split(":").map(Number);
          const horaFim = `${String(h + 1).padStart(2, "0")}:00`;
          mutacaoBloqueio.mutate({
            quadra_id: quadraId,
            data: diaSelecionado.data,
            hora_inicio: horario,
            hora_fim: horaFim,
          });
        },
      },
    ]);
  }

  function obterReservaDoSlot(quadraId: string, horario: string) {
    return agenda?.reservas.find(
      (r) => r.quadra_id === quadraId && r.hora_inicio === horario,
    );
  }

  function aoDetalhesReserva(quadraId: string, horario: string) {
    const reserva = obterReservaDoSlot(quadraId, horario);
    if (!reserva) return;

    if (reserva.tipo === "bloqueio") {
      return Alert.alert(
        "Horário bloqueado",
        `Esta quadra está bloqueada neste horário.`,
      );
    }

    if (isSlotPassado(reserva.data_reserva, reserva.hora_inicio)) {
      const nomeUsuario = reserva.usuario?.nome || "Cliente não informado";
      const horarioTexto = `${reserva.hora_inicio} - ${reserva.hora_fim}`;
      const mensagem = `Usuário: ${nomeUsuario}\nHorário: ${horarioTexto}`;
      return Alert.alert("Horário concluído", mensagem, [
        { text: "Fechar", style: "cancel" },
      ]);
    }

    const nomeUsuario = reserva.usuario?.nome || "Cliente não informado";
    const valor = reserva.quadra?.preco_hora?.toFixed(2) ?? "0.00";
    const horarioTexto = `${reserva.hora_inicio} - ${reserva.hora_fim}`;
    const mensagem = `Usuário: ${nomeUsuario}\nHorário: ${horarioTexto}\nValor: R$ ${valor}`;

    Alert.alert("Detalhes do agendamento", mensagem, [
      { text: "Fechar", style: "cancel" },
      {
        text: "Cancelar Agendamento",
        style: "destructive",
        onPress: () => mutacaoCancelarReserva.mutate(reserva.id),
      },
    ]);
  }

  function statusSlot(
    quadraId: string,
    horario: string,
  ): "livre" | "reservado" | "bloqueado" {
    if (!agenda) return "livre";
    const reserva = obterReservaDoSlot(quadraId, horario);
    if (!reserva) return "livre";
    if (reserva.tipo === "bloqueio") return "bloqueado";
    return "reservado";
  }

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Linha do Tempo</Text>
      </View>

      {/* Seletor de dias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.scrollDias}
        contentContainerStyle={estilos.conteudoDias}
      >
        {dias.map((dia) => {
          const ativo = dia.data === diaSelecionado.data;
          return (
            <TouchableOpacity
              key={dia.data}
              style={[estilos.cardDia, ativo && estilos.cardDiaAtivo]}
              onPress={() => setDiaSelecionado(dia)}
            >
              <Text style={[estilos.labelDia, ativo && estilos.textoDiaAtivo]}>
                {dia.label}
              </Text>
              <Text style={[estilos.numeroDia, ativo && estilos.textoDiaAtivo]}>
                {dia.diaNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legenda */}
      <View style={estilos.legenda}>
        <ItemLegenda cor={Cores.sucesso} label="Livre" />
        <ItemLegenda cor={Cores.primaria} label="Reservado" />
        <ItemLegenda cor={Cores.erro} label="Bloqueado" />
      </View>

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} horizontal>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={estilos.tabela}>
              {/* Cabeçalho: quadras */}
              <View style={estilos.linhaTabela}>
                <View style={[estilos.celulaHora, estilos.celulaHeader]} />
                {(agenda?.quadras || []).map((q) => (
                  <View
                    key={q.id}
                    style={[estilos.celulaQuadra, estilos.celulaHeader]}
                  >
                    <Text style={estilos.nomeQuadraHeader} numberOfLines={2}>
                      {q.nome_quadra}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Horários */}
              {HORARIOS.map((horario) => (
                <View key={horario} style={estilos.linhaTabela}>
                  <View style={estilos.celulaHora}>
                    <Text style={estilos.textoHora}>{horario}</Text>
                  </View>
                  {(agenda?.quadras || []).map((quadra) => {
                    const status = statusSlot(quadra.id, horario);
                    const passado = isSlotPassado(diaSelecionado.data, horario);
                    return (
                      <TouchableOpacity
                        key={quadra.id}
                        style={[
                          estilos.celulaSlot,
                          status === "reservado" && estilos.slotReservado,
                          status === "bloqueado" && estilos.slotBloqueado,
                          status === "livre" && estilos.slotLivre,
                        ]}
                        onPress={() => {
                          if (passado && status === "livre") {
                            return Alert.alert(
                              "Horário anterior",
                              "Este horário já passou e não pode ser alterado.",
                            );
                          }

                          if (status === "livre") {
                            aoBloqueioPress(quadra.id, horario);
                          } else if (status === "reservado") {
                            aoDetalhesReserva(quadra.id, horario);
                          }
                        }}
                        disabled={status === "bloqueado"}
                      >
                        <Text style={estilos.textoSlot}>
                          {status === "reservado"
                            ? "●"
                            : status === "bloqueado"
                              ? "✕"
                              : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

function ItemLegenda({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cor }}
      />
      <Text style={{ color: Cores.textoSecundario, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  cabecalho: {
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.md,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  tituloCabecalho: { ...Tipografia.titulo2 },
  scrollDias: { maxHeight: 90, backgroundColor: Cores.fundoCard },
  conteudoDias: {
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.sm,
    gap: 8,
  },
  cardDia: {
    width: 58,
    height: 66,
    backgroundColor: Cores.fundoInput,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  cardDiaAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  labelDia: { color: Cores.textoSecundario, fontSize: 11 },
  numeroDia: { color: Cores.texto, fontSize: 20, fontWeight: "700" },
  textoDiaAtivo: { color: Cores.texto },
  legenda: {
    flexDirection: "row",
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.sm,
    backgroundColor: Cores.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  centralizado: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabela: { padding: Espacamento.sm },
  linhaTabela: { flexDirection: "row", marginBottom: 2 },
  celulaHora: {
    width: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  celulaQuadra: {
    width: 110,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  celulaHeader: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 8,
    marginRight: 2,
  },
  nomeQuadraHeader: {
    color: Cores.texto,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  textoHora: { color: Cores.textoSecundario, fontSize: 12 },
  celulaSlot: {
    width: 110,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
    borderWidth: 1,
  },
  slotLivre: {
    backgroundColor: "rgba(76,175,80,0.1)",
    borderColor: Cores.sucesso,
  },
  slotReservado: {
    backgroundColor: "rgba(108,99,255,0.25)",
    borderColor: Cores.primaria,
  },
  slotBloqueado: {
    backgroundColor: "rgba(255,82,82,0.2)",
    borderColor: Cores.erro,
  },
  textoSlot: { color: Cores.texto, fontSize: 14 },
});

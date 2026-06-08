import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../shared/api';
import { Reserva } from '../../shared/tipos';
import { useAuth } from '../../contexto/AuthContexto';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

async function buscarMinhasReservas(): Promise<Reserva[]> {
  const resposta = await api.get('/reservas/minhas');
  return resposta.data;
}

async function cancelarReserva(id: string): Promise<void> {
  await api.delete(`/reservas/${id}`);
}

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} às ${hora}`;
}

function parseDateLocal(dataReserva: string, hora: string): Date {
  // Constrói Date com valores locais para evitar interpretação UTC no Android
  const parteData = dataReserva.trim().split('-').map(Number);
  const parteHora = hora.trim().split(':').map(Number);
  const ano = parteData[0];
  const mes = parteData[1] - 1; // meses em JS são 0-indexed
  const dia = parteData[2];
  const hh = parteHora[0] || 0;
  const mm = parteHora[1] || 0;
  return new Date(ano, mes, dia, hh, mm, 0, 0);
}

function isFuturo(dataReserva: string, horaInicio: string): boolean {
  const agora = new Date();
  const dataHoraReserva = parseDateLocal(dataReserva, horaInicio);
  return dataHoraReserva > agora;
}

function isEmAndamento(dataReserva: string, horaInicio: string, horaFim: string): boolean {
  const agora = new Date();
  const inicio = parseDateLocal(dataReserva, horaInicio);
  const fim = parseDateLocal(dataReserva, horaFim);
  return agora >= inicio && agora < fim;
}

export function TelaMeusJogos() {
  const insets = useSafeAreaInsets();
  const navegacao = useNavigation<any>();
  const { autenticado } = useAuth();
  const queryClient = useQueryClient();

  const { data: reservas, isLoading } = useQuery({
    queryKey: ['minhas-reservas'],
    queryFn: buscarMinhasReservas,
    enabled: autenticado,
  });

  const mutacaoCancelar = useMutation({
    mutationFn: cancelarReserva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-reservas'] });
      Alert.alert('Sucesso', 'Reserva cancelada com sucesso.');
    },
    onError: (erro: Error) => {
      Alert.alert('Erro', erro.message);
    },
  });

  function aoCancelar(reserva: Reserva) {
    Alert.alert(
      'Cancelar reserva',
      'Tem certeza que deseja cancelar este jogo?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, cancelar', style: 'destructive', onPress: () => mutacaoCancelar.mutate(reserva.id) },
      ]
    );
  }

  if (!autenticado) {
    return (
      <View style={[estilos.container, { paddingTop: insets.top }]}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.tituloCabecalho}>Meus Jogos</Text>
        </View>
        <View style={estilos.centralizado}>
          <Text style={estilos.iconeVazio}>🎮</Text>
          <Text style={estilos.textoVazio}>Faça login para ver seus jogos</Text>
          <TouchableOpacity
            style={estilos.botaoLogin}
            onPress={() => navegacao.navigate('Login' as never)}
          >
            <Text style={estilos.textoBotaoLogin}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Usa a data/hora como fonte de verdade para classificar, ignorando o status do backend
  // pois o backend pode marcar como 'concluida' antes do cliente atualizar a tela
  const todas = reservas || [];
  const canceladas = todas.filter(r => r.status === 'cancelada');
  const naoCanceladas = todas.filter(r => r.status !== 'cancelada');
  const emAndamento = naoCanceladas.filter(r => isEmAndamento(r.data_reserva, r.hora_inicio, r.hora_fim));
  const futuras = naoCanceladas.filter(r => isFuturo(r.data_reserva, r.hora_inicio));
  const passadas = naoCanceladas.filter(r => !isFuturo(r.data_reserva, r.hora_inicio) && !isEmAndamento(r.data_reserva, r.hora_inicio, r.hora_fim));

  return (
    <View style={[estilos.container, { paddingTop: insets.top }]}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloCabecalho}>Meus Jogos</Text>
      </View>

      {isLoading ? (
        <View style={estilos.centralizado}>
          <ActivityIndicator size="large" color={Cores.primaria} />
        </View>
      ) : (
        <FlatList
          data={[...emAndamento, ...futuras, ...passadas, ...canceladas]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const totalEmAndamento = emAndamento.length;
            const totalFuturas = futuras.length;
            const totalPassadas = passadas.length;
            const isFirstEmAndamento = index === 0 && totalEmAndamento > 0;
            const isFirstFutura = index === totalEmAndamento && totalFuturas > 0;
            const isFirstPassada = index === totalEmAndamento + totalFuturas && totalPassadas > 0;
            const isFirstCancelada = index === totalEmAndamento + totalFuturas + totalPassadas && canceladas.length > 0;
            return (
              <>
                {isFirstEmAndamento && <Text style={estilos.labelSecao}>Em andamento ({totalEmAndamento})</Text>}
                {isFirstFutura && <Text style={[estilos.labelSecao, totalEmAndamento > 0 ? { marginTop: Espacamento.lg } : {}]}>Próximos jogos ({totalFuturas})</Text>}
                {isFirstPassada && <Text style={[estilos.labelSecao, { marginTop: Espacamento.lg }]}>Histórico</Text>}
                {isFirstCancelada && <Text style={[estilos.labelSecao, { marginTop: Espacamento.lg }]}>Cancelados</Text>}
                <CardReserva reserva={item} onCancelar={() => aoCancelar(item)} />
              </>
            );
          }}
          ListEmptyComponent={
            <View style={estilos.centralizado}>
              <Text style={estilos.iconeVazio}>🏟️</Text>
              <Text style={estilos.textoVazio}>Nenhuma reserva encontrada</Text>
              <Text style={estilos.textoSub}>Reserve sua primeira quadra na aba Home</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function CardReserva({ reserva, onCancelar }: { reserva: Reserva; onCancelar: () => void }) {
  const cancelada = reserva.status === 'cancelada';
  const emAndamento = isEmAndamento(reserva.data_reserva, reserva.hora_inicio, reserva.hora_fim);
  const futuro = isFuturo(reserva.data_reserva, reserva.hora_inicio);
  const concluido = !futuro && !emAndamento && !cancelada;

  let badgeStyle = estilosCard.badgeAtiva;
  let badgeTexto = 'Agendado';
  let icone = '📅';

  if (cancelada) {
    badgeStyle = estilosCard.badgeCancelada;
    badgeTexto = 'Cancelado';
    icone = '✗';
  } else if (concluido) {
    badgeStyle = estilosCard.badgePassada;
    badgeTexto = 'Concluído';
    icone = '✓';
  } else if (emAndamento) {
    badgeStyle = estilosCard.badgeEmAndamento;
    badgeTexto = 'Em Andamento';
    icone = '⚡';
  }

  return (
    <View style={[estilosCard.container, (concluido || cancelada) && estilosCard.passada]}>
      <View style={estilosCard.linhaInfo}>
        <View style={estilosCard.iconeContainer}>
          <Text style={estilosCard.icone}>{icone}</Text>
        </View>
        <View style={estilosCard.info}>
          <Text style={estilosCard.nomeQuadra}>{reserva.quadra?.nome_quadra || 'Quadra'}</Text>
          <Text style={estilosCard.dataHora}>
            {formatarDataHora(reserva.data_reserva, reserva.hora_inicio)}
          </Text>
          <Text style={estilosCard.duracao}>{reserva.hora_inicio} - {reserva.hora_fim}</Text>
        </View>
        <View style={[estilosCard.badge, badgeStyle]}>
          <Text style={estilosCard.textoBadge}>{badgeTexto}</Text>
        </View>
      </View>

      {futuro && !cancelada && (
        <TouchableOpacity style={estilosCard.botaoCancelar} onPress={onCancelar}>
          <Text style={estilosCard.textoCancelar}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const estilosCard = StyleSheet.create({
  container: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.md,
    marginBottom: Espacamento.sm,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  passada: { opacity: 0.65 },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeContainer: {
    width: 44,
    height: 44,
    backgroundColor: Cores.fundoInput,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icone: { fontSize: 20 },
  info: { flex: 1 },
  nomeQuadra: { color: Cores.texto, fontSize: 15, fontWeight: '700' },
  dataHora: { color: Cores.textoSecundario, fontSize: 13, marginTop: 2 },
  duracao: { color: Cores.textoSecundario, fontSize: 12, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeAtiva: { backgroundColor: 'rgba(76,175,80,0.2)' },
  badgePassada: { backgroundColor: Cores.fundoInput },
  badgeCancelada: { backgroundColor: 'rgba(255,82,82,0.2)' },
  badgeEmAndamento: { backgroundColor: 'rgba(255,165,0,0.2)' },
  textoBadge: { color: Cores.texto, fontSize: 11, fontWeight: '600' },
  botaoCancelar: {
    marginTop: Espacamento.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Cores.erro,
    alignItems: 'center',
  },
  textoCancelar: { color: Cores.erro, fontWeight: '600', fontSize: 14 },
});

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
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  iconeVazio: { fontSize: 48 },
  textoVazio: { ...Tipografia.corpo, color: Cores.textoSecundario, textAlign: 'center' },
  textoSub: { ...Tipografia.corpoPequeno, textAlign: 'center' },
  botaoLogin: {
    backgroundColor: Cores.primaria,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 8,
  },
  textoBotaoLogin: { color: Cores.texto, fontWeight: '700', fontSize: 15 },
  lista: { padding: Espacamento.md, paddingBottom: Espacamento.xxl },
  labelSecao: { ...Tipografia.titulo3, marginBottom: Espacamento.sm },
});

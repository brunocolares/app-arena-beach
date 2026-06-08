import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexto/AuthContexto';
import { api } from '../../shared/api';
import { Cabecalho } from '../../componentes/Cabecalho';
import { Botao } from '../../componentes/Botao';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';
import { HomeStackParams } from '../../routes/ClienteTabs';

type NavProp = NativeStackNavigationProp<HomeStackParams, 'Checkout'>;
type RotaProp = RouteProp<HomeStackParams, 'Checkout'>;

interface CriarReservaPayload {
  quadra_id: string;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
}

async function criarReserva(dados: CriarReservaPayload): Promise<{ id: string }> {
  const r = await api.post('/reservas', dados);
  return r.data;
}

// Cria todas as reservas em série e retorna id da primeira
async function criarReservasMultiplas(
  quadraId: string,
  data: string,
  horarios: string[]
): Promise<string> {
  const ordenados = [...horarios].sort((a, b) => {
    const [hA] = a.split(':').map(Number);
    const [hB] = b.split(':').map(Number);
    return hA - hB;
  });

  let primeiroId = '';
  for (const horario of ordenados) {
    const [h] = horario.split(':').map(Number);
    const horaFim = `${String(h + 1).padStart(2, '0')}:00`;
    const resultado = await criarReserva({
      quadra_id: quadraId,
      data_reserva: data,
      hora_inicio: horario,
      hora_fim: horaFim,
    });
    if (!primeiroId) primeiroId = resultado.id;
  }
  return primeiroId;
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function horaParaMinutos(hora: string): number {
  const [h] = hora.split(':').map(Number);
  return h * 60;
}

export function TelaCheckout() {
  const navegacao = useNavigation<NavProp>();
  const rota = useRoute<RotaProp>();
  const { quadra, data, horarios } = rota.params;
  const { autenticado } = useAuth();

  // Ordena e calcula o bloco
  const horariosOrdenados = [...horarios].sort(
    (a, b) => horaParaMinutos(a) - horaParaMinutos(b)
  );
  const horaInicio = horariosOrdenados[0];
  const horaUltima = horariosOrdenados[horariosOrdenados.length - 1];
  const [hFim] = horaUltima.split(':').map(Number);
  const horaFimBloco = `${String(hFim + 1).padStart(2, '0')}:00`;
  const totalHoras = horarios.length;
  const totalValor = totalHoras * Number(quadra.preco_hora);

  const mutacao = useMutation({
    mutationFn: () => criarReservasMultiplas(quadra.id, data, horarios),
    onSuccess: (primeiroId) => {
      navegacao.navigate('Sucesso', { reservaId: primeiroId });
    },
    onError: (erro: Error) => {
      Alert.alert('Erro ao reservar', erro.message);
    },
  });

  function aoConfirmar() {
    if (!autenticado) {
      (navegacao as any).navigate('Login');
      return;
    }
    mutacao.mutate();
  }

  const fotoPrincipal = quadra.fotos?.[0];

  return (
    <View style={estilos.container}>
      <Cabecalho titulo="Confirmar reserva" onVoltar={() => navegacao.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scroll}>
        {/* Foto */}
        {fotoPrincipal ? (
          <Image source={{ uri: fotoPrincipal }} style={estilos.fotoQuadra} resizeMode="cover" />
        ) : (
          <View style={estilos.fotoPlaceholder}>
            <Text style={estilos.iconePlaceholder}>🏟️</Text>
          </View>
        )}

        {/* Card de detalhes */}
        <View style={estilos.card}>
          <Text style={estilos.nomeQuadra}>{quadra.nome_quadra}</Text>
          <View style={estilos.separador} />

          <ItemDetalhe icone="📅" label="Data" valor={formatarData(data)} />
          <ItemDetalhe
            icone="🕐"
            label="Período"
            valor={`${horaInicio} → ${horaFimBloco}`}
          />
          <ItemDetalhe
            icone="⏱️"
            label="Duração"
            valor={`${totalHoras} hora${totalHoras > 1 ? 's' : ''}`}
          />

          {/* Lista individual dos horários quando for mais de 1 */}
          {totalHoras > 1 && (
            <View style={estilos.listaHorarios}>
              <Text style={estilos.labelListaHorarios}>Horários reservados:</Text>
              <View style={estilos.tagsHorarios}>
                {horariosOrdenados.map(h => {
                  const [hora] = h.split(':').map(Number);
                  return (
                    <View key={h} style={estilos.tagHorario}>
                      <Text style={estilos.textoTagHorario}>
                        {h} – {String(hora + 1).padStart(2, '0')}:00
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={estilos.separador} />

          {/* Conta */}
          <View style={estilos.linhaCalculo}>
            <Text style={estilos.textoCalculo}>
              R$ {Number(quadra.preco_hora).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {totalHoras}h
            </Text>
          </View>
          <View style={estilos.linhaTotal}>
            <Text style={estilos.labelTotal}>Total a pagar</Text>
            <Text style={estilos.valorTotal}>
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Aviso login */}
        {!autenticado && (
          <View style={estilos.avisoLogin}>
            <Text style={estilos.textoAvisoLogin}>
              🔒 Você precisará fazer login para confirmar a reserva.
            </Text>
          </View>
        )}

        <View style={estilos.rodape}>
          <Botao
            titulo={autenticado ? 'Confirmar reserva' : 'Entrar e reservar'}
            onPress={aoConfirmar}
            carregando={mutacao.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ItemDetalhe({ icone, label, valor }: { icone: string; label: string; valor: string }) {
  return (
    <View style={estilosItem.container}>
      <Text style={estilosItem.icone}>{icone}</Text>
      <Text style={estilosItem.label}>{label}</Text>
      <Text style={estilosItem.valor}>{valor}</Text>
    </View>
  );
}

const estilosItem = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  icone: { fontSize: 18, width: 28 },
  label: { ...Tipografia.corpoPequeno, flex: 1 },
  valor: { color: Cores.texto, fontWeight: '600', fontSize: 15 },
});

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { paddingBottom: 40 },
  fotoQuadra: { width: '100%', height: 200 },
  fotoPlaceholder: {
    height: 200, backgroundColor: Cores.fundoCard,
    justifyContent: 'center', alignItems: 'center',
  },
  iconePlaceholder: { fontSize: 60 },
  card: {
    backgroundColor: Cores.fundoCard,
    margin: Espacamento.md,
    borderRadius: 16,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  nomeQuadra: { ...Tipografia.titulo2, marginBottom: 4 },
  separador: { height: 1, backgroundColor: Cores.borda, marginVertical: Espacamento.sm },
  listaHorarios: { marginTop: 4, marginBottom: 4 },
  labelListaHorarios: { color: Cores.textoSecundario, fontSize: 12, marginBottom: 6 },
  tagsHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagHorario: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Cores.primaria,
  },
  textoTagHorario: { color: Cores.primaria, fontSize: 12, fontWeight: '600' },
  linhaCalculo: { marginBottom: 4 },
  textoCalculo: { color: Cores.textoSecundario, fontSize: 13, textAlign: 'right' },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  labelTotal: { ...Tipografia.titulo3 },
  valorTotal: { color: Cores.primaria, fontSize: 22, fontWeight: '800' },

  avisoLogin: {
    backgroundColor: 'rgba(108,99,255,0.1)',
    marginHorizontal: Espacamento.md,
    marginTop: Espacamento.sm,
    borderRadius: 10,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.primaria,
  },
  textoAvisoLogin: { color: Cores.primaria, fontSize: 13 },
  rodape: { paddingHorizontal: Espacamento.md, marginTop: Espacamento.lg },
});

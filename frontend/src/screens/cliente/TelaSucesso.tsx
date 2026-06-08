import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Botao } from '../../componentes/Botao';
import { Cores, Espacamento, Tipografia } from '../../styles/tema';

export function TelaSucesso() {
  const navegacao = useNavigation<any>();
  const queryClient = useQueryClient();

  // Invalida o cache de reservas ASSIM que a tela abre,
  // garantindo que TelaMeusJogos já tenha dados frescos ao navegar
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['minhas-reservas'] });
  }, []);

  function voltarAoInicio() {
    // getParent() sobe do HomeStack para o ClienteTabs (Bottom Tabs)
    // e navega para a aba HomeTab, voltando ao topo da stack
    const abaPai = navegacao.getParent();
    if (abaPai) {
      abaPai.navigate('HomeTab');
      // Limpa o HomeStack para a tela Home (remove Quadras, Horarios, Checkout, Sucesso)
      navegacao.popToTop();
    } else {
      // fallback: tenta popToTop direto
      navegacao.popToTop();
    }
  }

  function verMeusJogos() {
    // Primeiro volta ao topo do HomeStack para limpar o histórico de navegação
    navegacao.popToTop();
    // Depois usa o navigator pai (ClienteTabs) para trocar para a aba MeusJogos
    const abaPai = navegacao.getParent();
    if (abaPai) {
      abaPai.navigate('MeusJogos');
    }
  }

  return (
    <View style={estilos.container}>
      <View style={estilos.conteudo}>
        <View style={estilos.iconeCirculo}>
          <Text style={estilos.icone}>✓</Text>
        </View>

        <Text style={estilos.titulo}>Reserva confirmada!</Text>
        <Text style={estilos.subtitulo}>
          Sua quadra foi reservada com sucesso. Você pode acompanhar o agendamento em "Meus Jogos".
        </Text>

        <View style={estilos.cartaoInfo}>
          <Text style={estilos.textoInfo}>
            📱 Guarde a confirmação e chegue com 10 minutos de antecedência.
          </Text>
        </View>
      </View>

      <View style={estilos.rodape}>
        <Botao
          titulo="Ver meus jogos"
          onPress={verMeusJogos}
        />
        <Botao
          titulo="Voltar ao início"
          onPress={voltarAoInicio}
          variante="secundario"
          estilo={{ marginTop: Espacamento.sm }}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo,
    justifyContent: 'space-between',
    padding: Espacamento.md,
  },
  conteudo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Espacamento.lg,
    paddingHorizontal: Espacamento.md,
  },
  iconeCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Cores.sucesso,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Cores.sucesso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  icone: {
    fontSize: 48,
    color: Cores.texto,
    fontWeight: '700',
  },
  titulo: {
    ...Tipografia.titulo1,
    textAlign: 'center',
  },
  subtitulo: {
    ...Tipografia.corpo,
    textAlign: 'center',
    color: Cores.textoSecundario,
    lineHeight: 24,
  },
  cartaoInfo: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 14,
    padding: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
    width: '100%',
  },
  textoInfo: {
    color: Cores.textoSecundario,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  rodape: {
    paddingBottom: Espacamento.md,
  },
});

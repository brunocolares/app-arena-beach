import React, { useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Quadra } from '../shared/tipos';
import { Cores, Espacamento } from '../styles/tema';

const { width } = Dimensions.get('window');
const LARGURA_FOTO = width - Espacamento.md * 2;

interface CardQuadraProps {
  quadra: Quadra;
  onPress: () => void;
}

export function CardQuadra({ quadra, onPress }: CardQuadraProps) {
  const [paginaAtual, setPaginaAtual] = useState(0);

  function aoRolarFoto(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const pagina = Math.round(evento.nativeEvent.contentOffset.x / LARGURA_FOTO);
    setPaginaAtual(pagina);
  }

  const fotos = quadra.fotos?.length > 0 ? quadra.fotos : [''];

  return (
    <View style={estilos.container}>
      {/* Carrossel de fotos */}
      <View style={estilos.containerFotos}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={aoRolarFoto}
        >
          {fotos.map((foto, idx) => (
            <Image
              key={idx}
              source={foto ? { uri: foto } : require('../assets/placeholder_quadra.png')}
              style={estilos.foto}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Indicadores de página */}
        {fotos.length > 1 && (
          <View style={estilos.indicadores}>
            {fotos.map((_, idx) => (
              <View
                key={idx}
                style={[estilos.ponto, idx === paginaAtual ? estilos.pontoAtivo : null]}
              />
            ))}
          </View>
        )}

        {/* Badge de avaliação */}
        {quadra.avaliacao ? (
          <View style={estilos.badgeAvaliacao}>
            <Text style={estilos.textoAvaliacao}>⭐ {quadra.avaliacao}</Text>
          </View>
        ) : null}
      </View>

      {/* Informações */}
      <TouchableOpacity style={estilos.info} onPress={onPress} activeOpacity={0.8}>
        <View style={estilos.linhaInfo}>
          <Text style={estilos.nomeQuadra}>{quadra.nome_quadra}</Text>
          <Text style={estilos.preco}>R$ {quadra.preco_hora}/h</Text>
        </View>

        {quadra.diferenciais && quadra.diferenciais.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.tagContainer}>
            {quadra.diferenciais.map((tag, idx) => (
              <View key={idx} style={estilos.tag}>
                <Text style={estilos.textoTag}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={estilos.botaoAgendar} onPress={onPress}>
          <Text style={estilos.textoBotao}>Ver horários</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 16,
    marginBottom: Espacamento.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Cores.borda,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  containerFotos: {
    position: 'relative',
    height: 200,
  },
  foto: {
    width: LARGURA_FOTO,
    height: 200,
  },
  indicadores: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pontoAtivo: {
    backgroundColor: Cores.texto,
    width: 18,
  },
  badgeAvaliacao: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoAvaliacao: {
    color: Cores.texto,
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    padding: Espacamento.md,
    gap: 8,
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nomeQuadra: {
    color: Cores.texto,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  preco: {
    color: Cores.primaria,
    fontSize: 16,
    fontWeight: '700',
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tag: {
    backgroundColor: Cores.fundoInput,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  textoTag: {
    color: Cores.textoSecundario,
    fontSize: 12,
  },
  botaoAgendar: {
    backgroundColor: Cores.primaria,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  textoBotao: {
    color: Cores.texto,
    fontWeight: '700',
    fontSize: 14,
  },
});

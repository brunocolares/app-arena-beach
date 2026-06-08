import React from 'react';
import { TouchableOpacity, Text, ImageBackground, View, StyleSheet, Dimensions } from 'react-native';
import { Esporte } from '../shared/tipos';
import { Cores, Espacamento } from '../styles/tema';

const { width } = Dimensions.get('window');
const LARGURA_CARD = (width - Espacamento.md * 2 - Espacamento.sm) / 2;

interface CardEsporteProps {
  esporte: Esporte;
  onPress: () => void;
}

export function CardEsporte({ esporte, onPress }: CardEsporteProps) {
  return (
    <TouchableOpacity style={estilos.container} onPress={onPress} activeOpacity={0.85}>
      <ImageBackground
        source={esporte.imagem_url ? { uri: esporte.imagem_url } : require('../assets/placeholder_esporte.png')}
        style={estilos.imagem}
        imageStyle={estilos.imagemBorda}
        resizeMode="cover"
      >
        <View style={estilos.overlay}>
          <View style={estilos.conteudo}>
            <Text style={estilos.nome} numberOfLines={2}>{esporte.nome_esporte}</Text>
            {esporte.preco_partir ? (
              <Text style={estilos.preco}>a partir de {esporte.preco_partir}</Text>
            ) : null}
            {esporte.quadras !== undefined ? (
              <View style={estilos.badge}>
                <Text style={estilos.textoBadge}>{esporte.quadras} quadra{esporte.quadras !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  container: {
    width: LARGURA_CARD,
    height: LARGURA_CARD * 1.1,
    marginBottom: Espacamento.sm,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imagem: {
    flex: 1,
  },
  imagemBorda: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: Cores.overlay,
    justifyContent: 'flex-end',
    padding: Espacamento.sm,
  },
  conteudo: {
    gap: 4,
  },
  nome: {
    color: Cores.texto,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  preco: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Cores.primaria,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  textoBadge: {
    color: Cores.texto,
    fontSize: 10,
    fontWeight: '600',
  },
});

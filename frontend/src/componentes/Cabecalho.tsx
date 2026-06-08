import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cores, Tipografia, Espacamento } from '../styles/tema';

interface CabecalhoProps {
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  acaoDireita?: React.ReactNode;
}

export function Cabecalho({ titulo, subtitulo, onVoltar, acaoDireita }: CabecalhoProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.container, { paddingTop: insets.top + 8 }]}>
      <View style={estilos.linha}>
        {onVoltar ? (
          <TouchableOpacity onPress={onVoltar} style={estilos.botaoVoltar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={estilos.iconeVoltar}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={estilos.botaoVoltar} />
        )}
        <View style={estilos.centroTexto}>
          <Text style={estilos.titulo} numberOfLines={1}>{titulo}</Text>
          {subtitulo ? <Text style={estilos.subtitulo} numberOfLines={1}>{subtitulo}</Text> : null}
        </View>
        <View style={estilos.acaoDireita}>
          {acaoDireita || <View style={{ width: 40 }} />}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    backgroundColor: Cores.fundoCard,
    paddingHorizontal: Espacamento.md,
    paddingBottom: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconeVoltar: {
    fontSize: 22,
    color: Cores.primaria,
    fontWeight: '700',
  },
  centroTexto: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    ...Tipografia.titulo3,
    textAlign: 'center',
  },
  subtitulo: {
    ...Tipografia.corpoPequeno,
    textAlign: 'center',
    marginTop: 2,
  },
  acaoDireita: {
    width: 40,
    alignItems: 'flex-end',
  },
});

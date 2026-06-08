import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Cores, Espacamento } from '../styles/tema';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
  larguraTotal?: boolean;
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  estilo,
  estiloTexto,
  larguraTotal = true,
}: BotaoProps) {
  const estiloBase = {
    primario: { bg: Cores.primaria, cor: Cores.texto },
    secundario: { bg: 'transparent', cor: Cores.primaria, borda: Cores.primaria },
    perigo: { bg: Cores.erro, cor: Cores.texto },
  }[variante];

  return (
    <TouchableOpacity
      style={[
        estilos.base,
        larguraTotal && estilos.larguraTotal,
        { backgroundColor: estiloBase.bg },
        variante === 'secundario' && { borderWidth: 1, borderColor: estiloBase.borda },
        (desabilitado || carregando) && estilos.desabilitado,
        estilo,
      ]}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={estiloBase.cor} />
      ) : (
        <Text style={[estilos.texto, { color: estiloBase.cor }, estiloTexto]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: Espacamento.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  larguraTotal: {
    width: '100%',
  },
  texto: {
    fontSize: 16,
    fontWeight: '700',
  },
  desabilitado: {
    opacity: 0.5,
  },
});

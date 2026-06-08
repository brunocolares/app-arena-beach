import { StyleSheet } from 'react-native';

export const Cores = {
  primaria: '#6C63FF',
  primariaDark: '#4A42D4',
  secundaria: '#FF6B6B',
  fundo: '#0F0F1A',
  fundoCard: '#1A1A2E',
  fundoInput: '#16213E',
  texto: '#FFFFFF',
  textoSecundario: '#A0A0B0',
  borda: '#2A2A3E',
  sucesso: '#4CAF50',
  erro: '#FF5252',
  aviso: '#FFC107',
  overlay: 'rgba(0,0,0,0.7)',
  gradienteInicio: '#1a1a2e',
  gradienteFim: '#16213e',
};

export const Tipografia = {
  titulo1: { fontSize: 28, fontWeight: '700' as const, color: Cores.texto },
  titulo2: { fontSize: 22, fontWeight: '700' as const, color: Cores.texto },
  titulo3: { fontSize: 18, fontWeight: '600' as const, color: Cores.texto },
  corpo: { fontSize: 16, fontWeight: '400' as const, color: Cores.texto },
  corpoPequeno: { fontSize: 14, fontWeight: '400' as const, color: Cores.textoSecundario },
  label: { fontSize: 12, fontWeight: '500' as const, color: Cores.textoSecundario },
};

export const Espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const estilosGlobais = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo,
  },
  card: {
    backgroundColor: Cores.fundoCard,
    borderRadius: 16,
    padding: Espacamento.md,
    marginBottom: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  botaoPrimario: {
    backgroundColor: Cores.primaria,
    paddingVertical: 14,
    paddingHorizontal: Espacamento.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoPrimario: {
    color: Cores.texto,
    fontSize: 16,
    fontWeight: '700',
  },
  botaoSecundario: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: Espacamento.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Cores.primaria,
  },
  textoBotaoSecundario: {
    color: Cores.primaria,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Cores.fundoInput,
    borderWidth: 1,
    borderColor: Cores.borda,
    borderRadius: 12,
    paddingHorizontal: Espacamento.md,
    paddingVertical: 12,
    color: Cores.texto,
    fontSize: 16,
    marginBottom: Espacamento.md,
  },
  labelInput: {
    color: Cores.textoSecundario,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  secaoTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Espacamento.md,
    marginTop: Espacamento.lg,
  },
  separador: {
    height: 1,
    backgroundColor: Cores.borda,
    marginVertical: Espacamento.md,
  },
  centralizadoVertical: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Cores.primaria,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoBadge: {
    color: Cores.texto,
    fontSize: 12,
    fontWeight: '600',
  },
});

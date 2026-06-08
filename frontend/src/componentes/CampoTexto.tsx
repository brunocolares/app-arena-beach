import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Cores, Espacamento } from '../styles/tema';

interface CampoTextoProps extends TextInputProps {
  label: string;
  erro?: string;
  senhaToggle?: boolean;
  containerStyle?: ViewStyle;
}

export function CampoTexto({ label, erro, senhaToggle, secureTextEntry, containerStyle, ...props }: CampoTextoProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <View style={[estilos.container, containerStyle]}>
      {label ? <Text style={estilos.label}>{label}</Text> : null}
      <View style={[estilos.inputContainer, erro ? estilos.inputErro : null]}>
        <TextInput
          style={estilos.input}
          placeholderTextColor={Cores.textoSecundario}
          secureTextEntry={senhaToggle ? !mostrarSenha : secureTextEntry}
          {...props}
        />
        {senhaToggle && (
          <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={estilos.botaoSenha}>
            <Text style={estilos.iconeSenha}>{mostrarSenha ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {erro ? <Text style={estilos.textoErro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    marginBottom: Espacamento.md,
  },
  label: {
    color: Cores.textoSecundario,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Cores.fundoInput,
    borderWidth: 1,
    borderColor: Cores.borda,
    borderRadius: 12,
    paddingHorizontal: Espacamento.md,
  },
  input: {
    flex: 1,
    color: Cores.texto,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputErro: {
    borderColor: Cores.erro,
  },
  textoErro: {
    color: Cores.erro,
    fontSize: 12,
    marginTop: 4,
  },
  botaoSenha: {
    padding: 4,
  },
  iconeSenha: {
    fontSize: 18,
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexto/AuthContexto';
import { Cores } from '../styles/tema';
import { ClienteTabs } from './ClienteTabs';
import { AdminTabs } from './AdminTabs';
import { TelaLogin } from '../screens/cliente/TelaLogin';
import { TelaCadastro } from '../screens/cliente/TelaCadastro';

export type RootStackParams = {
  ClienteTabs: undefined;
  AdminTabs: undefined;
  Login: { voltarPara?: string } | undefined;
  Cadastro: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Cores.fundo }}>
        <ActivityIndicator size="large" color={Cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario?.is_admin ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : (
          <>
            <Stack.Screen name="ClienteTabs" component={ClienteTabs} />
            <Stack.Screen name="Login" component={TelaLogin} />
            <Stack.Screen name="Cadastro" component={TelaCadastro} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

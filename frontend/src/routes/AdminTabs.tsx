import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { Cores } from '../styles/tema';

import { TelaDashboard } from '../screens/admin/TelaDashboard';
import { TelaLinhaDoTempo } from '../screens/admin/TelaLinhaDoTempo';
import { TelaGerenciarQuadras } from '../screens/admin/TelaGerenciarQuadras';
import { TelaFormularioQuadra } from '../screens/admin/TelaFormularioQuadra';
import { TelaGerenciarEsportes } from '../screens/admin/TelaGerenciarEsportes';
import { TelaFormularioEsporte } from '../screens/admin/TelaFormularioEsporte';
import { TelaAjustesArena } from '../screens/admin/TelaAjustesArena';
import { TelaPerfilAdmin } from '../screens/admin/TelaPerfilAdmin';

const Tab = createBottomTabNavigator();
const QuadrasStack = createNativeStackNavigator();
const EsportesStack = createNativeStackNavigator();
const AjustesStack = createNativeStackNavigator();

function QuadrasNavigator() {
  return (
    <QuadrasStack.Navigator screenOptions={{ headerShown: false }}>
      <QuadrasStack.Screen name="ListaQuadras" component={TelaGerenciarQuadras} />
      <QuadrasStack.Screen name="FormularioQuadra" component={TelaFormularioQuadra} />
    </QuadrasStack.Navigator>
  );
}

function EsportesNavigator() {
  return (
    <EsportesStack.Navigator screenOptions={{ headerShown: false }}>
      <EsportesStack.Screen name="ListaEsportes" component={TelaGerenciarEsportes} />
      <EsportesStack.Screen name="FormularioEsporte" component={TelaFormularioEsporte} />
    </EsportesStack.Navigator>
  );
}

// Stack de Ajustes agrupa: Ajustes da Arena + Perfil Admin
function AjustesNavigator() {
  return (
    <AjustesStack.Navigator screenOptions={{ headerShown: false }}>
      <AjustesStack.Screen name="AjustesArena" component={TelaAjustesArena} />
      <AjustesStack.Screen name="PerfilAdmin" component={TelaPerfilAdmin} />
    </AjustesStack.Navigator>
  );
}

function TabIconAdmin({ nome, icone, focado }: { nome: string; icone: string; focado: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icone}</Text>
      <Text style={{
        fontSize: 9,
        color: focado ? Cores.primaria : Cores.textoSecundario,
        marginTop: 2,
        fontWeight: focado ? '600' : '400',
      }}>
        {nome}
      </Text>
    </View>
  );
}

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Cores.fundoCard,
          borderTopColor: Cores.borda,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TelaDashboard}
        options={{ tabBarIcon: ({ focused }) => <TabIconAdmin nome="Dashboard" icone="📊" focado={focused} /> }}
      />
      <Tab.Screen
        name="LinhaDoTempo"
        component={TelaLinhaDoTempo}
        options={{ tabBarIcon: ({ focused }) => <TabIconAdmin nome="Agenda" icone="📅" focado={focused} /> }}
      />
      <Tab.Screen
        name="GerenciarQuadras"
        component={QuadrasNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIconAdmin nome="Quadras" icone="🏟️" focado={focused} /> }}
      />
      <Tab.Screen
        name="GerenciarEsportes"
        component={EsportesNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIconAdmin nome="Esportes" icone="⚽" focado={focused} /> }}
      />
      <Tab.Screen
        name="Ajustes"
        component={AjustesNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIconAdmin nome="Ajustes" icone="⚙️" focado={focused} /> }}
      />
    </Tab.Navigator>
  );
}

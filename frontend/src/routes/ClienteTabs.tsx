import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";
import { Cores, Espacamento } from "../styles/tema";
import { TelaHome } from "../screens/cliente/TelaHome";
import { TelaQuadras } from "../screens/cliente/TelaQuadras";
import { TelaHorarios } from "../screens/cliente/TelaHorarios";
import { TelaCheckout } from "../screens/cliente/TelaCheckout";
import { TelaSucesso } from "../screens/cliente/TelaSucesso";
import { TelaMeusJogos } from "../screens/cliente/TelaMeusJogos";
import { TelaPerfil } from "../screens/cliente/TelaPerfil";
import { Esporte, Quadra } from "../shared/tipos";
import { Ionicons } from "@expo/vector-icons";

export type HomeStackParams = {
  Home: undefined;
  Quadras: { esporte: Esporte };
  Horarios: { quadra: Quadra };
  Checkout: { quadra: Quadra; data: string; horarios: string[] };
  Sucesso: { reservaId: string };
};

const HomeStack = createNativeStackNavigator<HomeStackParams>();
const Tab = createBottomTabNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={TelaHome} />
      <HomeStack.Screen name="Quadras" component={TelaQuadras} />
      <HomeStack.Screen name="Horarios" component={TelaHorarios} />
      <HomeStack.Screen name="Checkout" component={TelaCheckout} />
      <HomeStack.Screen name="Sucesso" component={TelaSucesso} />
    </HomeStack.Navigator>
  );
}

function TabIcon({ nome, focado }: { nome: string; focado: boolean }) {
  const icones: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: "home",
    Jogos: "game-controller",
    Perfil: "person",
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Ionicons
        name={icones[nome] || "ellipse"}
        size={22}
        color={focado ? Cores.primaria : Cores.textoSecundario}
      />

      <Text
        style={{
          fontSize: 10,
          color: focado ? Cores.primaria : Cores.textoSecundario,
          marginTop: 2,
          fontWeight: focado ? "800" : "400",
        }}
      >
        {nome}
      </Text>
    </View>
  );
}

export function ClienteTabs() {
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
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon nome="Home" focado={focused} />,
        }}
      />
      <Tab.Screen
        name="MeusJogos"
        component={TelaMeusJogos}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon nome="Jogos" focado={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={TelaPerfil}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon nome="Perfil" focado={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

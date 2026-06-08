import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_TOKEN = '@arena:token';

// Altere para o IP da sua máquina ao testar no dispositivo físico
export const BASE_URL = 'http://10.0.2.2:3333'; // Android Emulator -> localhost

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(CHAVE_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Interceptor de resposta para erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error.response?.data?.mensagem ||
      error.response?.data?.message ||
      'Erro ao conectar com o servidor';
    return Promise.reject(new Error(mensagem));
  }
);

export const salvarToken = (token: string) =>
  AsyncStorage.setItem(CHAVE_TOKEN, token);

export const removerToken = () =>
  AsyncStorage.removeItem(CHAVE_TOKEN);

export const obterToken = () =>
  AsyncStorage.getItem(CHAVE_TOKEN);

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://192.168.100.29:8000/api/'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

/**
 * INTERCEPTOR DE PETICIONES
 * Agrega el slash final y el token de autorización si existe.
 */
api.interceptors.request.use(
    async (config) => {
        if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
            config.url += '/';
        }

        const isLogin = config.url.includes('login');
        const isRegister = config.url.includes('usuarios') && config.method === 'post';

        if (!isLogin && !isRegister) {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Token ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR DE RESPUESTAS (Auto-Logout)
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.log("Detectado error 401: Sesión inválida.");
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            if (global.forceLogout) {
                global.forceLogout();
            }
        }
        return Promise.reject(error);
    }
);

/**
 * SERVICIOS
 */
export const authService = {
    login: async (correo, password) => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            const response = await api.post('usuarios/login/', { 
                username: correo.trim(),
                password: password.trim() 
            });

            if (response.data && response.data.token) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user || response.data));
                return response.data;
            }
            throw new Error("Respuesta del servidor incompleta.");
        } catch (error) { 
            return handleError(error, "Error en login"); 
        }
    },

    register: async (nombre, correo, password) => {
        try {
            const response = await api.post('usuarios/', {
                nombre: nombre.trim(),
                correo: correo.trim().toLowerCase(),
                password: password.trim()
            });
            return response.data;
        } catch (error) { 
            return handleError(error, "Error en registro"); 
        }
    }
};

export const capturaService = {
    analizarRapido: async (imageUri) => {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'temp_scan.jpg';
            const cleanUri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');

            formData.append('imagen', { 
                uri: cleanUri, 
                name: filename, 
                type: 'image/jpeg' 
            });
            formData.append('colores_predominantes', '[]'); 

            const response = await api.post('capturas/analizar-rapido/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data; 
        } catch (error) { 
            return handleError(error, "Error en análisis rápido"); 
        }
    },

    crearCaptura: async (formData) => {
        try {
            const response = await api.post('capturas/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data; 
        } catch (error) { 
            return handleError(error, "Error al guardar captura oficial"); 
        }
    },

    obtenerBiblioteca: async () => {
        try {
            const response = await api.get('color/');
            return response.data;
        } catch (error) { 
            return handleError(error, "Error al recuperar biblioteca"); 
        }
    }
};

/**
 * MANEJADOR DE ERRORES CENTRALIZADO (Optimizado para Registro)
 */
const handleError = (error, defaultMsg) => {
    if (error.response) {
        const data = error.response.data;

        // 1. Manejo específico para CORREO YA EXISTENTE
        if (data.correo) {
            const msg = Array.isArray(data.correo) ? data.correo[0] : data.correo;
            // Si Django devuelve el mensaje estándar de "already exists" o similar
            if (msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("existe")) {
                throw new Error("Este correo ya está vinculado a otra cuenta.");
            }
            throw new Error(msg);
        }

        // 2. Manejo de Sesión
        if (error.response.status === 401) {
            throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
        }

        // 3. Otros campos (username, error general, detail)
        if (data.username) throw new Error("El nombre de usuario ya existe.");
        if (data.error) throw new Error(data.error);
        if (data.detail) throw new Error(data.detail);

        throw new Error(JSON.stringify(data));
    }
    
    if (error.message === 'Network Error') {
        throw new Error("No se pudo conectar con el servidor. Verifica tu conexión.");
    }
    
    throw new Error(error.message || defaultMsg);
};

export default api;
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// URL BASE - Asegúrate de que esta IP sea la correcta de tu servidor
// Cambia la URL de App Runner por la IP de tu servidor EC2
const API_BASE_URL = 'http://52.54.14.2:8000/api/';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});
/**
 * INTERCEPTOR DE PETICIONES
 */
api.interceptors.request.use(
    async (config) => {
        // Asegurar slash final para Django (Crucial para evitar errores 301/404)
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
 * INTERCEPTOR DE RESPUESTAS
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            if (global.forceLogout) global.forceLogout();
        }
        return Promise.reject(error);
    }
);

/**
 * SERVICIOS DE AUTENTICACIÓN
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
                const userData = response.data.user || response.data;
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                return response.data;
            }
            throw new Error("Error en la respuesta del servidor.");
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

/**
 * SERVICIOS DE CAPTURA (Cámara)
 */
export const capturaService = {
    crearCaptura: async (formData) => {
        try {
            const response = await api.post('capturas/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return handleError(error, "Error al guardar captura");
        }
    },

    actualizarNombreCaptura: async (id, nuevoNombre) => {
        try {
            const response = await api.patch(`capturas/${id}/`, {
                nombre: nuevoNombre
            });
            return response.data;
        } catch (error) {
            return handleError(error, "Error al actualizar nombre de captura");
        }
    },

    analizarRapido: async (imageUri) => {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'scan.jpg';
            
            formData.append('imagen', { 
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''), 
                name: filename, 
                type: 'image/jpeg' 
            });
            formData.append('colores_predominantes', '[]'); 

            const response = await api.post('capturas/analizar-rapido/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data; 
        } catch (error) { 
            return handleError(error, "Error en análisis"); 
        }
    }
};

/**
 * SERVICIOS DE PALETAS (Unificado y Corregido)
 */
export const paletaService = {
    // CORRECCIÓN: Se añade capturaId como parámetro opcional para vincular la imagen
    guardarPaletaTecnica: async (nombre, origen, colores, userId, capturaId = null) => {
        try {
            const payload = {
                nombre: nombre,
                origen: origen, 
                colores_hex: colores,
                usuario: userId
            };

            // Vínculo crítico para que la biblioteca muestre la foto
            if (capturaId) {
                payload.captura = capturaId;
            }

            const response = await api.post('paletas/', payload);
            return response.data;
        } catch (error) {
            return handleError(error, "Error al guardar paleta");
        }
    },

    actualizarPaleta: async (paletaId, data) => {
        try {
            const payload = {
                nombre: data.nombre,
                colores_hex: data.colores, 
                usuario: data.usuario
            };
            const response = await api.patch(`paletas/${paletaId}/`, payload);
            return response.data;
        } catch (error) {
            return handleError(error, "Error al actualizar paleta");
        }
    },

    listarPaletas: async (userId) => {
        try {
            const response = await api.get(`paletas/?usuario=${userId}`);
            
            // Procesamiento de datos para asegurar que el Frontend entienda los tipos
            const paletasProcesadas = response.data.map(p => ({
                ...p,
                // Normalización de origen para la UI
                origen: p.origen || (p.origen_display?.includes("Manual") ? "MANUAL" : "CAMARA"),
                colores_hex: p.colores_hex || []
            }));

            return { data: paletasProcesadas };
        } catch (error) {
            return handleError(error, "Error al obtener paletas");
        }
    },

    eliminarPaleta: async (paletaId) => {
        try {
            const response = await api.delete(`paletas/${paletaId}/`);
            return response.data;
        } catch (error) {
            return handleError(error, "Error al eliminar la paleta");
        }
    }
};

/**
 * MANEJADOR DE ERRORES CENTRALIZADO
 */
const handleError = (error, defaultMsg) => {
    if (error.response) {
        const data = error.response.data;
        
        // Manejo específico de errores de validación de Django
        if (data.usuario) {
            const msg = Array.isArray(data.usuario) ? data.usuario[0] : data.usuario;
            throw new Error(msg); 
        }
        if (data.correo) throw new Error("Este correo ya está registrado.");
        if (data.detail) throw new Error(data.detail);
        if (data.error) throw new Error(data.error);
        
        throw new Error(typeof data === 'object' ? JSON.stringify(data) : data);
    }
    
    if (error.message === 'Network Error') {
        throw new Error("Sin conexión al servidor. Verifica que tu PC y el celular estén en la misma red y la IP sea correcta.");
    }
    
    throw new Error(error.message || defaultMsg);
};

export default api;
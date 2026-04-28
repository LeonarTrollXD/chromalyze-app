import { useAuth as useGlobalAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const useAuth = () => {
    const globalAuth = useGlobalAuth(); 

    /**
     * Inicia sesión y persiste el token
     */
    const executeLogin = async (correo, password) => {
        try {
            const response = await authService.login(correo.trim(), password.trim());
            
            const token = response.token || (response.user && response.user.token);
            const userData = response.user || response;

            if (userData && token) {
                if (globalAuth?.login) {
                    await globalAuth.login(userData, token); 
                    return { success: true };
                }
                return { success: false, error: "Error interno: Contexto no disponible." };
            } 
            return { success: false, error: "Respuesta del servidor incompleta." };

        } catch (error) {
            // USAMOS EL MENSAJE QUE VIENE DE API.JS
            console.error("Error en executeLogin:", error.message);
            return { success: false, error: error.message };
        }
    };

    /**
     * Registro de nuevo usuario - ¡CORREGIDO!
     */
    const executeRegister = async (nombre, correo, password) => {
        try {
            const result = await authService.register(nombre.trim(), correo.trim(), password.trim());
            
            if (result) {
                return { 
                    success: true, 
                    message: "¡Registro exitoso! Ya puedes iniciar sesión." 
                };
            }
            return { success: false, error: "No se recibió confirmación del servidor." };

        } catch (error) {
            // AQUÍ ESTABA EL ERROR:
            // Ahora retornamos directamente error.message que ya viene procesado por api.js
            console.error("Error en executeRegister:", error.message);
            return { 
                success: false, 
                error: error.message || "Error al registrarse" 
            };
        }
    };

    /**
     * Cierra la sesión
     */
    const executeLogout = async () => {
        try {
            if (globalAuth?.logout) {
                await globalAuth.logout();
            }
        } catch (error) {
            console.error("Error en logout:", error);
        }
    };

    return { 
        executeLogin, 
        executeRegister,
        executeLogout,
        user: globalAuth?.user,
        isAuthenticated: globalAuth?.isAuthenticated,
        loading: globalAuth?.loading
    };
};
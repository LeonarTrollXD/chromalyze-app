import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. CARGA ULTRA RÁPIDA: Solo revisa si hay Token y Datos localmente
    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const [authDataSerialized, token] = await Promise.all([
                    AsyncStorage.getItem('userData'),
                    AsyncStorage.getItem('userToken')
                ]);

                if (authDataSerialized && token) {
                    setUser(JSON.parse(authDataSerialized));
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Error al recuperar sesión local:", error);
            } finally {
                // Esto garantiza que la pantalla de Loading desaparezca rápido
                setLoading(false);
            }
        };
        loadStorageData();
    }, []);

    /**
     * Iniciar Sesión (Solo guarda local y cambia estado)
     */
    const login = async (userData, token) => {
        try {
            const finalUser = userData.user ? userData.user : userData;
            const finalToken = token || userData.token;

            await AsyncStorage.setItem('userData', JSON.stringify(finalUser));
            await AsyncStorage.setItem('userToken', finalToken);
            
            setUser(finalUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error al guardar sesión:", error.message);
        }
    };

    /**
     * Cerrar Sesión (Limpia local y manda al Login)
     */
    const logout = async () => {
        try {
            await AsyncStorage.clear(); // Borra TODO de un solo golpe
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
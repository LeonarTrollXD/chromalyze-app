import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native'; 
import { useAuth } from '../context/AuthContext';

// Pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/home'; 
import ScannerScreen from '../screens/ScannerScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ManualCreatorScreen from '../screens/ManualCreatorScreen'; // <-- IMPORTADO

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. CONFIGURACIÓN DEL MENÚ INFERIOR ---
const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#69ED44',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#161618',
                    borderTopWidth: 0,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                }
            }}
        >
            <Tab.Screen 
                name="InicioTab" 
                component={HomeScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
                    tabBarLabel: 'HOME'
                }}
            />
            <Tab.Screen 
                name="ScannerTab" 
                component={ScannerScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📸</Text>,
                    tabBarLabel: 'SCANNER'
                }}
            />
            <Tab.Screen 
                name="ColeccionTab" 
                component={ResultsScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎨</Text>,
                    tabBarLabel: 'BIBLIOTECA'
                }}
            />
        </Tab.Navigator>
    );
};

// --- 2. NAVEGADOR PRINCIPAL ---
const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <LoadingScreen />; 

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <Stack.Group screenOptions={{ animationTypeForReplace: 'pop' }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Group>
            ) : (
                <Stack.Group>
                    <Stack.Screen name="MainApp" component={TabNavigator} />
                    
                    <Stack.Screen 
                        name="Scanner" 
                        component={ScannerScreen} 
                        options={{ 
                            headerShown: true, 
                            headerTitle: 'ESCANEAR COLOR', 
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 }, 
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />

                    {/* --- NUEVA RUTA REGISTRADA PARA DISEÑO MANUAL --- */}
                    <Stack.Screen 
                        name="ManualCreator" 
                        component={ManualCreatorScreen} 
                        options={{ 
                            headerShown: false, // La pantalla ya tiene su propio Header personalizado
                        }}
                    />
                    
                    <Stack.Screen name="Loading" component={LoadingScreen} />
                    
                    <Stack.Screen 
                        name="Results" 
                        component={ResultsScreen} 
                        options={{
                            headerShown: true,
                            headerTitle: 'ANÁLISIS DE COLOR',
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 },
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
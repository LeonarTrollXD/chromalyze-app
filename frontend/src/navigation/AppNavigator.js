import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native'; 
import { useAuth } from '../context/AuthContext';

// --- PANTALLAS ---
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/home'; 
import ScannerScreen from '../screens/ScannerScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ManualCreatorScreen from '../screens/ManualCreatorScreen';
import PaletteScannerScreen from '../screens/PaletteScannerScreen';
import BibliotecaScreen from '../screens/BibliotecaScreen';
import ConfigurationScreen from '../screens/ConfigurationScreen'; // <--- IMPORTADA

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. CONFIGURACIÓN DEL MENÚ INFERIOR (TAB NAVIGATOR) ---
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
                    height: 75,
                    paddingBottom: 15,
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
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🏠</Text>,
                    tabBarLabel: 'HOME'
                }}
            />
            
            <Tab.Screen 
                name="PaletteLab" 
                component={ScannerScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🧪</Text>,
                    tabBarLabel: 'PALETTE LAB'
                }}
            />

            <Tab.Screen 
                name="BibliotecaTab" 
                component={BibliotecaScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📁</Text>,
                    tabBarLabel: 'BIBLIOTECA' 
                }}
            />

            {/* MODIFICADO: Ahora apunta a ConfigurationScreen */}
            <Tab.Screen 
                name="ConfigTab" 
                component={ConfigurationScreen} 
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙️</Text>,
                    tabBarLabel: 'AJUSTES'
                }}
            />
        </Tab.Navigator>
    );
};

// --- 2. NAVEGADOR PRINCIPAL (STACK) ---
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
                        name="PaletteScanner" 
                        component={PaletteScannerScreen} 
                        options={{ 
                            headerShown: true, 
                            headerTitle: 'LABORATORIO MANUAL', 
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 }, 
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />

                    <Stack.Screen 
                        name="ManualCreator" 
                        component={ManualCreatorScreen} 
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen 
                        name="Scanner" 
                        component={ScannerScreen} 
                        options={{ 
                            headerShown: true, 
                            headerTitle: 'EXTRACTOR DE COLOR', 
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 }, 
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />
                    
                    <Stack.Screen name="Loading" component={LoadingScreen} />
                    
                    <Stack.Screen 
                        name="Results" 
                        component={ResultsScreen} 
                        options={{
                            headerShown: true,
                            headerTitle: 'RESULTADOS AI',
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 },
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />

                    <Stack.Screen 
                        name="Biblioteca" 
                        component={BibliotecaScreen} 
                        options={{
                            headerShown: true,
                            headerTitle: 'MIS PROYECTOS',
                            headerStyle: { backgroundColor: '#1A1A1C', borderBottomWidth: 0 },
                            headerTintColor: '#FFF',
                            headerTitleAlign: 'center',
                        }}
                    />

                    {/* También añadimos Ajustes al Stack para poder navegar directamente si es necesario */}
                    <Stack.Screen 
                        name="Ajustes" 
                        component={ConfigurationScreen} 
                        options={{
                            headerShown: true,
                            headerTitle: 'CONFIGURACIÓN',
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
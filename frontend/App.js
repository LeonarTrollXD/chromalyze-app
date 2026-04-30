import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext'; 
// Importamos el nuevo contexto de colores
import { ColorProvider } from './src/context/ColorContext'; 
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      {/* El ColorProvider debe envolver la navegación para que los datos no se borren */}
      <ColorProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ColorProvider>
    </AuthProvider>
  );
}
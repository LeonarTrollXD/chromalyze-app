import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// Quitamos 'icon' por ahora si no lo usas, para limpiar las props
const ButtonPrimary = ({ title, onPress }) => (
  <TouchableOpacity 
    style={styles.button} 
    onPress={onPress}
    activeOpacity={0.7} // Forzamos un número puro
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginVertical: 15,
    width: '80%',
    alignItems: 'center',
    // Aseguramos que elevation sea un número (ya lo es, pero lo mantenemos limpio)
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ButtonPrimary;
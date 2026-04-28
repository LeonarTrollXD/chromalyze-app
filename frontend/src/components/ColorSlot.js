import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Animated 
} from 'react-native';

const ColorSlot = ({ color, isActive, onPress, index }) => {
    // Si no hay color definido, usamos el gris oscuro de tu paleta base
    const displayColor = color || '#2C2C2E';

    return (
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.container}
        >
            <View style={[
                styles.slot, 
                { backgroundColor: displayColor },
                isActive && styles.activeSlot
            ]}>
                {/* Indicador visual de selección (punto neón) */}
                {isActive && (
                    <View style={styles.activeIndicator} />
                )}
            </View>
            
            {/* Texto informativo debajo del slot */}
            <Text style={[styles.label, isActive && styles.activeLabel]}>
                {isActive ? 'EDITANDO' : `COLOR ${index + 1}`}
            </Text>
            <Text style={styles.hexText}>{displayColor.toUpperCase()}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginHorizontal: 5,
    },
    slot: {
        width: 55,
        height: 55,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#1C1C1E', // Borde sutil para despegar del fondo
        justifyContent: 'center',
        alignItems: 'center',
        // Sombra suave para dar profundidad
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    activeSlot: {
        borderColor: '#69ED44', // Tu verde neón característico
        borderWidth: 3,
        transform: [{ scale: 1.1 }], // Crece un poco al estar activo
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#69ED44',
        position: 'absolute',
        top: -12, // Posicionado arriba del círculo
    },
    label: {
        color: '#8E8E93',
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 10,
        letterSpacing: 0.5,
    },
    activeLabel: {
        color: '#69ED44',
    },
    hexText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '500',
        marginTop: 2,
        opacity: 0.6,
    }
});

export default ColorSlot;
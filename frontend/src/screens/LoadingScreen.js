import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    ActivityIndicator, 
    Alert, 
    StyleSheet, 
    StatusBar,
    Animated,
    Platform
} from 'react-native';
import { capturaService } from '../services/api'; 
import { useAuth } from '../context/AuthContext';

// CAMBIO CLAVE: Cambiamos onNavigate por navigation
const LoadingScreen = ({ navigation, route }) => {
    const { user } = useAuth(); 
    const imageUri = route?.params?.imageUri || null; 
    const isQuickScan = route?.params?.isQuickScan || false;

    const fadeAnim = new Animated.Value(0.3);

    useEffect(() => {
        // Animación de pulso para el texto
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        const procesarImagen = async () => {
            if (!imageUri) {
                Alert.alert("Chromalyze Error", "No se detectó una imagen.");
                navigation.navigate('Scanner'); // CAMBIO: navigation.navigate
                return;
            }

            try {
                let resultado;

                if (isQuickScan) {
                    // MODO ESCANEO RÁPIDO
                    resultado = await capturaService.analizarRapido(imageUri);
                } else {
                    // MODO GUARDADO DEFINITIVO
                    const userId = user?.id; 
                    if (!userId) {
                        Alert.alert("Sesión Requerida", "Debes estar logueado para guardar.");
                        navigation.navigate('Login'); // CAMBIO: navigation.navigate
                        return;
                    }

                    const formData = new FormData();
                    formData.append('usuario', userId);
                    formData.append('nombre', "Captura " + new Date().toLocaleTimeString());
                    formData.append('colores_predominantes', '[]'); 
                    formData.append('imagen', {
                        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                        type: 'image/jpeg',
                        name: 'captura.jpg',
                    });

                    resultado = await capturaService.crearCaptura(formData);
                }
                
                if (resultado && (resultado.colores_hex || resultado.colores_predominantes)) {
                    const finalColors = resultado.colores_hex || resultado.colores_predominantes;
                    
                    // CAMBIO: navigation.replace para que al dar atrás no vuelva a cargar
                    navigation.replace('Results', { 
                        colorsData: finalColors, 
                        imageUri: imageUri, 
                        captureId: resultado.id || null 
                    });
                } else {
                    throw new Error("El motor no devolvió datos de color.");
                }
            } catch (error) {
                console.error("Error en el flujo de análisis:", error);
                Alert.alert(
                    "Error de Análisis", 
                    error.message || "No se pudo conectar con el servidor Django."
                );
                navigation.navigate('Scanner'); // CAMBIO: navigation.navigate
            }
        };

        procesarImagen();
    }, [imageUri]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <Text style={styles.brandTitle}>Chromalyze</Text>
                <Text style={styles.brandSubtitle}>IA ENGINE</Text>
            </View>

            <View style={styles.loaderBox}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#69ED44" />
                </View>
                
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.text}>
                        {isQuickScan ? "ESCANEO TEMPORAL ACTIVADO" : "PROCESANDO Y GUARDANDO"}
                    </Text>
                </Animated.View>
                
                <View style={styles.divider} />
                
                <Text style={styles.subtext}>
                    {isQuickScan 
                        ? "Analizando píxeles sin ocupar espacio en tu biblioteca."
                        : "Sincronizando paleta con tu cuenta de usuario."}
                </Text>

                <View style={styles.serverTag}>
                    <Text style={styles.serverText}>DJANGO BACKEND ACTIVE</Text>
                </View>
            </View>

            <Text style={styles.footerText}>PILLOW ENGINE @ DOCKER CONTAINER</Text>
        </View>
    );
};

// Los estilos se mantienen igual
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0A0A0B', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    header: {
        position: 'absolute',
        top: 60,
        alignItems: 'center'
    },
    brandTitle: { 
        color: '#FFF', 
        fontSize: 24, 
        fontWeight: '200', 
        letterSpacing: 4 
    },
    brandSubtitle: { 
        color: '#69ED44', 
        fontSize: 10, 
        fontWeight: 'bold', 
        letterSpacing: 2,
        marginTop: 5
    },
    loaderBox: { 
        alignItems: 'center', 
        backgroundColor: '#161618', 
        paddingVertical: 50,
        paddingHorizontal: 30, 
        borderRadius: 35, 
        borderWidth: 1, 
        borderColor: '#2C2C2E',
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10
    },
    spinnerContainer: {
        marginBottom: 25,
        transform: [{ scale: 1.5 }]
    },
    text: { 
        color: '#FFF', 
        fontWeight: '900', 
        letterSpacing: 1.5, 
        fontSize: 14, 
        textAlign: 'center' 
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        width: '40%',
        marginVertical: 20
    },
    subtext: { 
        color: '#8E8E93', 
        fontSize: 12, 
        fontWeight: '400', 
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10
    },
    serverTag: {
        marginTop: 30,
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#333'
    },
    serverText: {
        color: '#69ED44',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    footerText: {
        position: 'absolute',
        bottom: 50,
        color: '#3A3A3C',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});

export default LoadingScreen;
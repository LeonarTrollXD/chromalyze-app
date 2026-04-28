import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    StatusBar, 
    Platform,
    ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const ScannerScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                
                if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
                    Alert.alert(
                        "Permisos Requeridos", 
                        "Chromalyze necesita acceso a la cámara y galería para analizar colores reales."
                    );
                }
            }
        })();
    }, []);

    const processImageResult = (result) => {
        if (!result.canceled && result.assets && result.assets.length > 0) {
            navigation.navigate('Loading', { 
                imageUri: result.assets[0].uri,
                isQuickScan: true 
            });
        }
    };

    const handleMediaAction = async (actionType) => {
        try {
            setLoading(true);
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, 
                aspect: [1, 1], 
                quality: 0.7, 
            };

            const result = actionType === 'camera' 
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            processImageResult(result);
        } catch (error) {
            Alert.alert("Error de Sistema", "No se pudo acceder al módulo de visión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* HEADER DE MARCA */}
                <View style={styles.header}>
                    <Text style={styles.brandTitle}>CHROMALYZE AI</Text>
                    <Text style={styles.headerTitle}>MOTOR DE CAPTURA</Text>
                    <View style={styles.underline} />
                    <Text style={styles.subtitle}>
                        Selecciona el origen para extraer o crear tu paleta de colores profesional.
                    </Text>
                </View>

                {/* OPCIONES DE ORIGEN */}
                <View style={styles.optionsContainer}>
                    
                    {/* 1. CÁMARA */}
                    <TouchableOpacity 
                        style={styles.cardPrimary} 
                        onPress={() => handleMediaAction('camera')} 
                        disabled={loading}
                    >
                        <View style={styles.iconContainer}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.emojiIcon}>📷</Text>}
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitleDark}>CÁMARA EN VIVO</Text>
                            <Text style={styles.cardDescDark}>Análisis en tiempo real</Text>
                        </View>
                        <View style={styles.statusDotActive} />
                    </TouchableOpacity>

                    {/* 2. BIBLIOTECA */}
                    <TouchableOpacity 
                        style={styles.cardSecondary} 
                        onPress={() => handleMediaAction('gallery')} 
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, styles.darkIconBg]}>
                            <Text style={styles.emojiIcon}>🖼️</Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitleLight}>BIBLIOTECA</Text>
                            <Text style={styles.cardDescLight}>Importar imagen existente</Text>
                        </View>
                    </TouchableOpacity>

                    {/* 3. DISEÑO MANUAL (NUEVO) */}
                    <TouchableOpacity 
                        style={styles.cardManual} 
                        onPress={() => navigation.navigate('ManualCreator')} 
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, styles.manualIconBg]}>
                            <Text style={styles.emojiIcon}>🎨</Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitleManual}>DISEÑO MANUAL</Text>
                            <Text style={styles.cardDescLight}>Crea combinaciones sin fotos</Text>
                        </View>
                        <View style={styles.proBadge}>
                            <Text style={styles.proText}>CREATIVO</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* INFO TÉCNICA */}
                <View style={styles.techInfo}>
                    <Text style={styles.techText}>ALGORITMO: K-MEANS CLUSTERING</Text>
                    <Text style={styles.techText}>SISTEMA: GENERACIÓN MANUAL v1.0</Text>
                </View>

                {/* BOTÓN VOLVER */}
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backBtn}
                >
                    <Text style={styles.backBtnText}>CANCELAR OPERACIÓN</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0B' },
    scrollContent: { paddingHorizontal: 30, paddingVertical: 60, alignItems: 'center' },
    
    header: { alignItems: 'center', marginBottom: 40 },
    brandTitle: { color: '#69ED44', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
    headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '200', letterSpacing: 2 },
    underline: { height: 2, backgroundColor: '#69ED44', width: 40, marginTop: 10 },
    subtitle: { color: '#8E8E93', fontSize: 13, marginTop: 20, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

    optionsContainer: { width: '100%', gap: 15 },
    
    cardPrimary: { 
        backgroundColor: '#FFF', 
        borderRadius: 25, 
        padding: 22, 
        flexDirection: 'row', 
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#69ED44',
        shadowOpacity: 0.1
    },
    cardSecondary: { 
        backgroundColor: '#161618', 
        borderRadius: 25, 
        padding: 22, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E'
    },
    cardManual: { 
        backgroundColor: '#161618', 
        borderRadius: 25, 
        padding: 22, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#69ED4433', // Un borde verde muy sutil
    },
    cardInfo: { flex: 1, marginLeft: 15 },
    cardTitleDark: { color: '#000', fontSize: 17, fontWeight: '900' },
    cardDescDark: { color: '#666', fontSize: 11, marginTop: 2 },
    cardTitleLight: { color: '#FFF', fontSize: 17, fontWeight: '900' },
    cardTitleManual: { color: '#69ED44', fontSize: 17, fontWeight: '900' },
    cardDescLight: { color: '#8E8E93', fontSize: 11, marginTop: 2 },

    iconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
    darkIconBg: { backgroundColor: '#2C2C2E' },
    manualIconBg: { backgroundColor: '#0A0A0B', borderWidth: 1, borderColor: '#2C2C2E' },
    emojiIcon: { fontSize: 22 },
    
    statusDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#69ED44' },
    proBadge: { backgroundColor: '#69ED44', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    proText: { color: '#000', fontSize: 8, fontWeight: 'bold' },

    techInfo: { marginTop: 40, alignItems: 'center', gap: 5 },
    techText: { color: '#3A3A3C', fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5 },

    backBtn: { marginTop: 40, padding: 20 },
    backBtnText: { color: '#636366', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 }
});

export default ScannerScreen;
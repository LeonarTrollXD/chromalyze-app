import React, { useState, useCallback } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    Alert, 
    StatusBar,
    ScrollView,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useAuth as useGlobalAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { paletaService } from '../services/api';
// Importamos los iconos para identificar el origen
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useGlobalAuth(); 
    const [recentPalettes, setRecentPalettes] = useState([]); // Cambiado para ser general
    const [captureCount, setCaptureCount] = useState(0);
    const [totalManualCount, setTotalManualCount] = useState(0); 
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const userId = user?.id || (user?.user && user.user.id);
                    
                    if (userId) {
                        const response = await paletaService.listarPaletas(userId);
                        const allPalettes = response.data || [];

                        // --- 1. RECIENTES (MEZCLADOS) ---
                        // Tomamos los 3 primeros de la lista general (asumiendo que vienen ordenados por fecha desc)
                        setRecentPalettes(allPalettes.slice(0, 3));

                        // --- 2. LÓGICA DE FILTRADO PARA CONTADORES (PLAN BÁSICO) ---
                        
                        // Filtrar Manuales para el contador verde
                        const manualOnly = allPalettes.filter(p => 
                            p.origen === 'MANUAL' || 
                            p.origen_label?.toLowerCase().includes('manual')
                        );

                        // Filtrar Capturas para el contador azul
                        const capturesOnly = allPalettes.filter(p => 
                            p.origen === 'CAMARA' || 
                            p.origen_label?.toLowerCase().includes('cámara') ||
                            p.origen_label?.toLowerCase().includes('captura')
                        );

                        // Guardamos los conteos exactos
                        setTotalManualCount(manualOnly.length);
                        setCaptureCount(capturesOnly.length);
                    }
                } catch (error) {
                    console.error("Error al sincronizar data en Home:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [user])
    );

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            Alert.alert("Chromalyze", "No se pudo cerrar la sesión correctamente.");
        }
    };

    const limit = 3;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* --- HEADER & BRANDING --- */}
                <View style={styles.brandSection}>
                    <Text style={styles.brandTitle}>Chromalyze</Text>
                    <View style={styles.sloganContainer}>
                        <View style={styles.liveDot} />
                        <Text style={styles.sloganText}>SISTEMAS UNIVERSIDAD • v1.0</Text>
                    </View>
                </View>

                {/* --- BIENVENIDA --- */}
                <View style={styles.welcomeCard}>
                    <View>
                        <Text style={styles.welcomeLabel}>PROYECTO ACTIVO</Text>
                        <Text style={styles.userName}>
                            HOLA, {user?.nombre?.split(' ')[0].toUpperCase() || 'USUARIO'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.logoutCircle} onPress={handleLogout}>
                        <Text style={styles.logoutIcon}>🚪</Text>
                    </TouchableOpacity>
                </View>

                {/* --- SECCIÓN DE RECIENTES (AHORA MUESTRA TODO) --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>RECIENTES</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ColeccionTab')}> 
                        <Text style={styles.seeMore}>Ver todas</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {loading ? (
                        <View style={[styles.paletteCard, { justifyContent: 'center' }]}>
                            <ActivityIndicator color="#69ED44" />
                        </View>
                    ) : (
                        recentPalettes.map((palette) => (
                            <View key={palette.id} style={styles.paletteCard}>
                                <View style={styles.colorStrip}>
                                    {(palette.colores_hex || palette.colores || []).map((color, index) => (
                                        <View 
                                            key={index} 
                                            style={[
                                                styles.colorDot, 
                                                { backgroundColor: typeof color === 'string' ? color : (color.hex || '#333') }
                                            ]} 
                                        />
                                    ))}
                                </View>
                                
                                <View style={styles.nameRow}>
                                    <Text style={styles.paletteName} numberOfLines={1}>
                                        {palette.nombre}
                                    </Text>
                                    {/* El icono cambia dinámicamente según el origen de la paleta reciente */}
                                    <MaterialCommunityIcons 
                                        name={palette.origen === 'CAMARA' || palette.origen_label?.toLowerCase().includes('cámara') ? 'camera' : 'brush'} 
                                        size={14} 
                                        color="#666" 
                                    />
                                </View>
                            </View>
                        ))
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.paletteCard, styles.addCard]} 
                        onPress={() => navigation.navigate('PaletteScanner')}
                    >
                        <Text style={styles.addIcon}>+</Text>
                        <Text style={styles.addText}>CREAR</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* --- SECCIÓN PLAN BASICO (LÓGICA FILTRADA) --- */}
                <Text style={styles.sectionTitle}>PLAN BASICO</Text>
                <View style={styles.statusGrid}>
                    <View style={styles.statusBox}>
                        <Text style={styles.statusValue}>{totalManualCount}<Text style={styles.statusMax}>/{limit}</Text></Text>
                        <Text style={styles.statusLabel}>PALETAS TÉCNICAS</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarInfo, { width: `${Math.min((totalManualCount/limit)*100, 100)}%` }]} />
                        </View>
                    </View>

                    <View style={styles.statusBox}>
                        <Text style={styles.statusValue}>{captureCount}<Text style={styles.statusMax}>/{limit}</Text></Text>
                        <Text style={styles.statusLabel}>ESCANEOS CÁMARA</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarInfo, { width: `${Math.min((captureCount/limit)*100, 100)}%`, backgroundColor: '#44CCFF' }]} />
                        </View>
                    </View>
                </View>

                {/* --- INSPIRACIÓN --- */}
                <Text style={[styles.sectionTitle, {marginTop: 30}]}>INSPIRACIÓN</Text>
                <TouchableOpacity style={styles.inspirationCard}>
                    <View style={[styles.bigColorBlock, { backgroundColor: '#69ED44' }]} />
                    <View style={styles.inspirationInfo}>
                        <Text style={styles.colorHex}>#69ED44</Text>
                        <Text style={styles.colorName}>Verde Chromalyze</Text>
                        <Text style={styles.inspirationTip}>Optimizado para contraste en OLED.</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.academicText}>ANÁLISIS Y DISEÑO II • 2026</Text>
                </View>
            </ScrollView>
        </View>
    );
};
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0B' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    brandSection: { marginTop: 60, marginBottom: 25 },
    brandTitle: { color: '#FFF', fontSize: 34, fontWeight: '100', letterSpacing: 3 },
    sloganContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69ED44', marginRight: 6 },
    sloganText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
    welcomeCard: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: '#121214', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: '#1F1F22', marginBottom: 30
    },
    welcomeLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
    userName: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
    logoutCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1F1F22', justifyContent: 'center', alignItems: 'center' },
    logoutIcon: { fontSize: 18 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
    sectionTitle: { color: '#444', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    seeMore: { color: '#69ED44', fontSize: 12, fontWeight: '600' },
    horizontalScroll: { marginBottom: 10 },
    paletteCard: { backgroundColor: '#161618', padding: 16, borderRadius: 20, marginRight: 15, width: 150, borderWidth: 1, borderColor: '#242427', height: 100, justifyContent: 'center' },
    colorStrip: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    
    // Nuevo estilo para la fila de nombre e icono
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    paletteName: { color: '#EEE', fontSize: 12, fontWeight: '600', flex: 1, marginRight: 5 },
    
    addCard: { borderStyle: 'dashed', borderColor: '#333', alignItems: 'center' },
    addIcon: { color: '#69ED44', fontSize: 26, fontWeight: 'bold' },
    addText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
    statusGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    statusBox: { flex: 1, backgroundColor: '#121214', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#1F1F22' },
    statusValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    statusMax: { color: '#444', fontSize: 16 },
    statusLabel: { color: '#888', fontSize: 9, fontWeight: 'bold', marginTop: 4, marginBottom: 12 },
    progressBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
    progressBarInfo: { height: '100%', backgroundColor: '#69ED44', borderRadius: 2 },
    inspirationCard: { backgroundColor: '#121214', borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1F1F22' },
    bigColorBlock: { width: 70, height: 70, borderRadius: 18 },
    inspirationInfo: { marginLeft: 15, flex: 1 },
    colorHex: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    colorName: { color: '#69ED44', fontSize: 13, marginBottom: 4 },
    inspirationTip: { color: '#555', fontSize: 11 },
    footer: { marginTop: 50, alignItems: 'center', opacity: 0.4 },
    academicText: { color: '#FFF', fontSize: 10, letterSpacing: 2 }
});

export default HomeScreen;
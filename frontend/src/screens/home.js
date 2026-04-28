import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    Alert, 
    StatusBar,
    ScrollView,
    Dimensions
} from 'react-native';
import { useAuth as useGlobalAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useGlobalAuth(); 
    
    const [recentPalettes, setRecentPalettes] = useState([
        { id: 1, colors: ['#69ED44', '#2C2C2E', '#FFFFFF', '#0A0A0B'], name: 'Modern Dark' },
        { id: 2, colors: ['#FF5733', '#C70039', '#900C3F', '#581845'], name: 'Atardecer' },
    ]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            Alert.alert("Chromalyze", "No se pudo cerrar la sesión correctamente.");
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* --- SECCIÓN SUPERIOR: BRANDING --- */}
                <View style={styles.brandSection}>
                    <Text style={styles.brandTitle}>Chromalyze</Text>
                    <View style={styles.sloganContainer}>
                        <Text style={styles.sloganText}>
                            SISTEMAS UNIVERSIDAD • v1.0
                        </Text>
                    </View>
                </View>

                {/* --- BIENVENIDA AL USUARIO --- */}
                <View style={styles.welcomeCard}>
                    <View>
                        <Text style={styles.welcomeLabel}>SESIÓN ACTIVA</Text>
                        <Text style={styles.userName}>
                            HOLA, {user?.nombre?.split(' ')[0].toUpperCase() || 'USUARIO'}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.logoutCircle} 
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.logoutIcon}>🚪</Text>
                    </TouchableOpacity>
                </View>

                {/* --- SECCIÓN: RECIENTES (SUBIDA DE POSICIÓN) --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TUS ÚLTIMAS CREACIONES</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ColeccionTab')}> 
                        <Text style={styles.seeMore}>Ver todas</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.horizontalScroll}
                >
                    {recentPalettes.map((palette) => (
                        <View key={palette.id} style={styles.paletteCard}>
                            <View style={styles.colorStrip}>
                                {palette.colors.map((color, index) => (
                                    <View key={index} style={[styles.colorDot, { backgroundColor: color }]} />
                                ))}
                            </View>
                            <Text style={styles.paletteName}>{palette.name}</Text>
                        </View>
                    ))}
                    {/* Botón rápido para ir al motor de captura/creación */}
                    <TouchableOpacity 
                        style={[styles.paletteCard, styles.addCard]} 
                        onPress={() => navigation.navigate('Scanner')}
                    >
                        <Text style={styles.addIcon}>+</Text>
                        <Text style={styles.addText}>NUEVO</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* --- SECCIÓN: INSPIRACIÓN --- */}
                <Text style={styles.sectionTitle}>INSPIRACIÓN DEL DÍA</Text>
                <View style={styles.inspirationCard}>
                    <View style={[styles.bigColorBlock, { backgroundColor: '#69ED44' }]} />
                    <View style={styles.inspirationInfo}>
                        <Text style={styles.colorHex}>#69ED44</Text>
                        <Text style={styles.colorName}>Verde Chromalyze</Text>
                        <Text style={styles.inspirationTip}>Úsalo como color de acento sobre fondos #0A0A0B para un look futurista.</Text>
                    </View>
                </View>

                {/* --- INFO DE PLAN --- */}
                <View style={styles.planBadge}>
                    <Text style={styles.planText}>ESTADO: PLAN BASICO (3/3 DISPONIBLES)</Text>
                </View>

                {/* --- FOOTER ACADÉMICO --- */}
                <View style={styles.footer}>
                    <View style={styles.dot} />
                    <Text style={styles.academicText}>PROYECTO DE GRADO - SISTEMAS</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0B' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    brandSection: { marginTop: 50, alignItems: 'flex-start', marginBottom: 25 },
    brandTitle: { color: '#FFF', fontSize: 32, fontWeight: '100', letterSpacing: 2 },
    sloganContainer: { marginTop: 5 },
    sloganText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    welcomeCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#161618', 
        padding: 20, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#2C2C2E',
        marginBottom: 25
    },
    welcomeLabel: { color: '#8E8E93', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    userName: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
    logoutCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
    logoutIcon: { fontSize: 16 },
    sectionTitle: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1, marginTop: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    seeMore: { color: '#69ED44', fontSize: 12 },
    horizontalScroll: { marginBottom: 30, marginTop: 5 },
    paletteCard: { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 18, marginRight: 15, width: 140, borderWidth: 1, borderColor: '#2C2C2E' },
    colorStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    colorDot: { width: 22, height: 22, borderRadius: 11 },
    paletteName: { color: '#FFF', fontSize: 12, fontWeight: '500' },
    addCard: { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderColor: '#444' },
    addIcon: { color: '#69ED44', fontSize: 24, fontWeight: 'bold' },
    addText: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 5 },
    inspirationCard: { backgroundColor: '#161618', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    bigColorBlock: { width: 80, height: 80, borderRadius: 15 },
    inspirationInfo: { marginLeft: 15, flex: 1 },
    colorHex: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    colorName: { color: '#69ED44', fontSize: 12, marginBottom: 5 },
    inspirationTip: { color: '#888', fontSize: 10, lineHeight: 14 },
    planBadge: { backgroundColor: '#161618', padding: 12, borderRadius: 15, marginTop: 40, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    planText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold' },
    footer: { marginTop: 40, marginBottom: 20, alignItems: 'center', opacity: 0.3 },
    academicText: { color: '#FFF', fontSize: 9, letterSpacing: 1 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#69ED44', marginBottom: 10 }
});

export default HomeScreen;
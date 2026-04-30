import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ImageBackground, 
    ActivityIndicator, 
    Alert, 
    Dimensions,
    StatusBar 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { paletaService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../context/ColorContext';

const { width } = Dimensions.get('window');

const BibliotecaScreen = () => {
    const navigation = useNavigation();
    const { setPalette } = useColors(); 
    const [paletas, setPaletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Función auxiliar para convertir HEX a RGB (necesaria para el contexto)
    const hexToRgb = (hex) => {
        if (!hex) return 'rgb(255, 255, 255)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const cargarDatos = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            const userData = JSON.parse(userDataStr);
            const userId = userData?.id || userData?.pk || userData?.user?.id;
            
            if (userId) {
                const response = await paletaService.listarPaletas(userId);
                // Usamos reverse() para que las más recientes salgan primero
                setPaletas(response.data.reverse());
            }
        } catch (error) {
            console.error("Error al cargar biblioteca:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    const handleEliminar = (id, nombre) => {
        Alert.alert(
            "Eliminar Paleta",
            `¿Estás seguro de que deseas borrar "${nombre}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await paletaService.eliminarPaleta(id);
                            cargarDatos();
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar.");
                        }
                    }
                }
            ]
        );
    };

    const handlePressPaleta = (item) => {
        if (item.origen === 'CAMARA') {
            navigation.navigate('Results', {
                imageUri: item.captura_image_url,
                colorsData: item.colores_hex.map(hex => ({
                    hex: hex,
                    percent: 0 
                })),
                isSaved: true,
                existenteId: item.captura || item.id, 
                nombreExistente: item.nombre 
            });
        } else {
            const hexList = item.colores_hex || [];
            const coloresParaContexto = [0, 1, 2, 3, 4].map((idx) => {
                const hexValue = hexList[idx] || '#FFFFFF';
                return {
                    id: idx, 
                    hex: hexValue,
                    rgb: hexToRgb(hexValue),
                    filled: !!hexList[idx] 
                };
            });

            setPalette(coloresParaContexto);
            navigation.navigate('PaletteScanner', {
                paletaExistente: item 
            });
        }
    };

    const renderItem = ({ item }) => {
        const isCamara = item.origen === 'CAMARA';
        const coloresMostrar = item.colores_hex ? item.colores_hex.slice(0, 5) : [];

        return (
            <TouchableOpacity 
                activeOpacity={0.85}
                style={styles.cardContainer} 
                onPress={() => handlePressPaleta(item)}
            >
                <View style={styles.cardInner}>
                    {isCamara && item.captura_image_url ? (
                        <ImageBackground 
                            source={{ uri: item.captura_image_url }} 
                            style={styles.backgroundImage} 
                            imageStyle={{ borderRadius: 20 }}
                        >
                            <LinearGradient 
                                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']} 
                                style={styles.gradientOverlay} 
                            />
                        </ImageBackground>
                    ) : (
                        <LinearGradient 
                            colors={['#1c1c1e', '#000000']} 
                            style={styles.manualBackground} 
                        />
                    )}

                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.paletaNombre} numberOfLines={1}>
                                {item.nombre.toUpperCase()}
                            </Text>
                            <Text style={styles.fechaText}>
                                {new Date(item.fecha_creacion || item.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => handleEliminar(item.id, item.nombre)} 
                            style={styles.deleteBtn}
                        >
                            <Ionicons name="trash-bin" size={18} color="#FF4B4B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.paletteWrapper}>
                            {coloresMostrar.map((color, index) => (
                                <View key={index} style={styles.colorCapsule}>
                                    <View style={[styles.colorCircle, { backgroundColor: color }]} />
                                    <Text style={styles.hexLabel}>{color.replace('#', '').toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <View style={styles.typeBadge}>
                            <MaterialCommunityIcons 
                                name={isCamara ? "camera-outline" : "flask-outline"} 
                                size={12} 
                                color="#69ED44" 
                            />
                            <Text style={styles.typeText}>{isCamara ? "SCAN" : "LAB"}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#69ED44" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.headerTitleContainer}>
                <Text style={styles.welcomeText}>Colección Personal</Text>
                <Text style={styles.mainTitle}>BIBLIOTECA</Text>
            </View>

            <FlatList
                data={paletas}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onRefresh={cargarDatos}
                refreshing={refreshing}
                ListFooterComponent={
                    <TouchableOpacity 
                        style={styles.directAccessBtn} 
                        onPress={() => navigation.navigate('PaletteScanner')}
                    >
                        <View style={styles.directAccessContent}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="plus" size={24} color="#69ED44" />
                            </View>
                            <View>
                                <Text style={styles.directAccessTitle}>NUEVO DISEÑO MANUAL</Text>
                                <Text style={styles.directAccessSub}>Crea una combinación desde cero</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#69ED44" />
                    </TouchableOpacity>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="color-palette-outline" size={60} color="#333" />
                        <Text style={styles.emptyText}>Vacío</Text>
                        <Text style={styles.emptySubText}>Aún no has guardado ninguna paleta.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    centered: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { marginTop: 60, paddingHorizontal: 25, marginBottom: 20 },
    welcomeText: { color: '#69ED44', fontSize: 14, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    mainTitle: { color: 'white', fontSize: 34, fontWeight: '800' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    cardContainer: {
        height: 180,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: '#161618',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    cardInner: { flex: 1, borderRadius: 20, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
    backgroundImage: { ...StyleSheet.absoluteFillObject },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    manualBackground: { ...StyleSheet.absoluteFillObject },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
    titleContainer: { flex: 1 },
    paletaNombre: { color: 'white', fontSize: 20, fontWeight: '700' },
    fechaText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
    deleteBtn: { backgroundColor: 'rgba(255, 75, 75, 0.15)', padding: 8, borderRadius: 12 },
    footerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 2 },
    paletteWrapper: { 
        flexDirection: 'row', 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        padding: 6, 
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    colorCapsule: { alignItems: 'center', marginHorizontal: 4 },
    colorCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    hexLabel: { color: 'white', fontSize: 8, marginTop: 4, fontWeight: '500', opacity: 0.8 },
    typeBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(105, 237, 68, 0.1)', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(105, 237, 68, 0.3)'
    },
    typeText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    emptySubText: { color: '#666', fontSize: 14, marginTop: 5 },
    directAccessBtn: {
        backgroundColor: '#161618',
        borderRadius: 22,
        padding: 20,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderStyle: 'dashed',
    },
    directAccessContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    directAccessTitle: {
        color: '#69ED44',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    directAccessSub: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 2,
    },
});

export default BibliotecaScreen;
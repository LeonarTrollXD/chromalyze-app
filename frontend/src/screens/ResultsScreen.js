import React, { useState, useEffect } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, Image, 
    ScrollView, Alert, Modal, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { capturaService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResultsScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const { colorsData: rawColors = [], imageUri = null } = route.params || {};
    
    const [colorsData, setColorsData] = useState([]);
    const [mode, setMode] = useState('view'); 
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [captureName, setCaptureName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const isColorDark = (hex) => {
        if (!hex) return false;
        const color = hex.replace('#', '');
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    };

    useEffect(() => {
        if (rawColors && rawColors.length > 0) {
            const cleanedColors = rawColors.map(item => ({
                ...item,
                percent: item.percent || item.porcentaje || 0,
                rgb: item.rgb || (item.r ? `${item.r}, ${item.g}, ${item.b}` : 'N/A')
            }));
            setColorsData(cleanedColors);
        }
    }, [rawColors]);

    const handleConfirmSave = async () => {
        if (!captureName.trim()) {
            return Alert.alert("Chromalyze", "Ingresa un nombre para tu proyecto.");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            
            // 1. Datos básicos
            formData.append('nombre', captureName.trim());
            // Usamos el ID del usuario del contexto o un fallback seguro
            formData.append('usuario', user?.id || user?.pk || 1); 
            
            // 2. Colores: Los enviamos como String JSON (importante para Django)
            formData.append('colores_predominantes', JSON.stringify(colorsData)); 
            
            // 3. Imagen: Construcción robusta del archivo
            if (imageUri) {
                const filename = imageUri.split('/').pop() || `captura_${Date.now()}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('imagen', {
                    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                    name: filename,
                    type: type,
                });
            }

            // Llamada al servicio corregido
            await capturaService.crearCaptura(formData);
            
            setIsSaved(true);
            setShowSaveModal(false); 
            Alert.alert("¡Éxito!", "Proyecto guardado en tu biblioteca.");

        } catch (err) {
            console.log("DEBUG ERROR CAPTURA:", err.message);
            // Mostramos el error real que viene de api.js
            Alert.alert("Error de Guardado", err.message || "No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoToEditor = () => {
        if (selectedIndices.length === 0) return Alert.alert("Aviso", "Selecciona al menos un color.");
        const selectedColors = selectedIndices.map(i => colorsData[i]);
        navigation.navigate('EditorPaleta', { selectedColors }); 
    };

    const toggleColor = (index) => {
        if (mode !== 'combining') return;
        setSelectedIndices(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>ANÁLISIS DE COLOR REAL</Text>
                
                <View style={styles.imageCard}>
                    {imageUri && <Image source={{ uri: imageUri }} style={styles.mainImage} resizeMode="cover" />}
                    <View style={styles.overlayTag}>
                        <Text style={styles.tagText}>IA ANALYZED</Text>
                    </View>
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>
                        {mode === 'combining' 
                            ? "SELECCIONA COLORES PARA TU COMBINACIÓN" 
                            : "COLORES PREDOMINANTES DETECTADOS"}
                    </Text>
                    
                    {colorsData.map((item, index) => {
                        const isDark = isColorDark(item.hex);
                        return (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => toggleColor(index)}
                                activeOpacity={mode === 'combining' ? 0.7 : 1}
                                style={[
                                    styles.colorRow, 
                                    mode === 'combining' && selectedIndices.includes(index) && styles.selectedRow
                                ]}
                            >
                                <View style={styles.rowTop}>
                                    <View style={styles.colorInfoLeft}>
                                        <View style={[
                                            styles.miniSquare, 
                                            { 
                                                backgroundColor: item.hex,
                                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                                borderWidth: 1
                                            }
                                        ]} />
                                        <View>
                                            <Text style={styles.hexText}>{item.hex.toUpperCase()}</Text>
                                            <Text style={styles.rgbText}>RGB: {item.rgb || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.percentText}>{item.percent}%</Text>
                                </View>
                                
                                <View style={styles.barBackground}>
                                    <View style={[
                                        styles.barFill, 
                                        { 
                                            backgroundColor: item.hex, 
                                            width: `${item.percent}%`,
                                        }
                                    ]} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.buttonArea}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#69ED44" />
                    ) : mode === 'view' ? (
                        <>
                            {isSaved ? (
                                <TouchableOpacity 
                                    style={[styles.btnMain, { backgroundColor: '#69ED44' }]} 
                                    onPress={() => navigation.navigate('Home')}
                                >
                                    <Text style={styles.btnTextBlack}>VER MIS PROYECTOS</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.btnMain} onPress={() => setShowSaveModal(true)}>
                                    <Text style={styles.btnTextBlack}>GUARDAR PROYECTO</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.btnAccent} onPress={() => setMode('combining')}>
                                <Text style={styles.btnTextGreen}>CREAR COMBINACIÓN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Scanner')}>
                                <Text style={styles.btnTextWhite}>NUEVA CAPTURA</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.btnConfirm} onPress={handleGoToEditor}>
                                <Text style={styles.btnTextBlack}>
                                    CONTINUAR CON {selectedIndices.length} {selectedIndices.length === 1 ? 'COLOR' : 'COLORES'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => {setMode('view'); setSelectedIndices([]);}}>
                                <Text style={styles.btnTextWhite}>CANCELAR SELECCIÓN</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>

            <Modal visible={showSaveModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#69ED44" />
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>NOMBRE DEL PROYECTO</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ej: Pared Sala de Estar" 
                                    placeholderTextColor="#636366"
                                    value={captureName}
                                    onChangeText={setCaptureName}
                                    autoFocus={true}
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowSaveModal(false)}>
                                        <Text style={styles.btnTextWhite}>VOLVER</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmSave}>
                                        <Text style={styles.btnTextBlack}>CONFIRMAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F10' },
    content: { padding: 20, paddingBottom: 50 },
    headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginVertical: 25, letterSpacing: 1 },
    imageCard: { width: '100%', height: 280, borderRadius: 25, overflow: 'hidden', marginBottom: 20, backgroundColor: '#1C1C1E', position: 'relative' },
    mainImage: { width: '100%', height: '100%' },
    overlayTag: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    tagText: { color: '#69ED44', fontSize: 10, fontWeight: 'bold' },
    panel: { backgroundColor: '#1C1C1E', borderRadius: 25, padding: 20, marginBottom: 20 },
    panelTitle: { color: '#636366', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
    colorRow: { marginBottom: 18, padding: 10, borderRadius: 15 },
    selectedRow: { backgroundColor: 'rgba(105, 237, 68, 0.15)', borderWidth: 1, borderColor: '#69ED44' },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    colorInfoLeft: { flexDirection: 'row', alignItems: 'center' },
    miniSquare: { width: 42, height: 42, borderRadius: 12, marginRight: 15 },
    hexText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    rgbText: { color: '#636366', fontSize: 12 },
    percentText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
    barBackground: { height: 10, backgroundColor: '#2C2C2E', borderRadius: 10, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 10 },
    buttonArea: { gap: 12 },
    btnMain: { backgroundColor: '#FFF', padding: 18, borderRadius: 18, alignItems: 'center' },
    btnAccent: { borderWidth: 1, borderColor: '#69ED44', padding: 18, borderRadius: 18, alignItems: 'center' },
    btnConfirm: { backgroundColor: '#69ED44', padding: 18, borderRadius: 18, alignItems: 'center' },
    btnSecondary: { padding: 15, alignItems: 'center' },
    btnTextBlack: { color: '#000', fontWeight: '900', fontSize: 15 },
    btnTextGreen: { color: '#69ED44', fontWeight: '900', fontSize: 15 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', opacity: 0.8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
    modalBox: { backgroundColor: '#1C1C1E', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { color: '#FFF', textAlign: 'center', marginBottom: 25, fontWeight: '900', letterSpacing: 1 },
    input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 18, borderRadius: 15, marginBottom: 25, fontSize: 16 },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalBtnCancel: { flex: 1, padding: 15, alignItems: 'center' },
    modalBtnConfirm: { flex: 1, backgroundColor: '#69ED44', padding: 15, alignItems: 'center', borderRadius: 12 }
});

export default ResultsScreen;
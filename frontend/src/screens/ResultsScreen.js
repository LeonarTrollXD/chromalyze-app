import React, { useState, useEffect } from 'react';
import { 
    View, Text, TouchableOpacity, Image, 
    ScrollView, Alert, Modal, TextInput, ActivityIndicator, Platform,
    StyleSheet 
} from 'react-native';
import { capturaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ColorContext'; 

const ResultsScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const { setPalette } = useColors(); 
    
    const { 
        colorsData: rawColors = [], 
        imageUri = null, 
        existenteId = null, 
        nombreExistente = '' 
    } = route.params || {};
    
    const [colorsData, setColorsData] = useState([]);
    const [mode, setMode] = useState('view'); 
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [captureName, setCaptureName] = useState(nombreExistente || '');
    const [loading, setLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(!!existenteId); 
    const [isUpdatingName, setIsUpdatingName] = useState(!!existenteId);

    useEffect(() => {
        if (rawColors && rawColors.length > 0) {
            const sortedColors = [...rawColors].sort((a, b) => {
                const pA = a.percent || a.porcentaje || 0;
                const pB = b.percent || b.porcentaje || 0;
                return pB - pA;
            });

            const cleanedColors = sortedColors.map(item => ({
                ...item,
                percent: item.percent || item.porcentaje || 0,
                rgb: item.rgb || (item.r ? `${item.r}, ${item.g}, ${item.b}` : 'N/A'),
                hex: item.hex || item.codigo_hex
            }));
            setColorsData(cleanedColors);
        }
    }, [rawColors]);

    const handleConfirmSave = async () => {
        const cleanName = captureName.trim();
        if (!cleanName) {
            return Alert.alert("Chromalyze", "Ingresa un nombre para tu proyecto.");
        }

        setLoading(true);
        try {
            if (isUpdatingName && existenteId) {
                await capturaService.actualizarNombreCaptura(existenteId, cleanName);
                Alert.alert("Éxito", "Nombre actualizado correctamente.");
            } else {
                const formData = new FormData();
                formData.append('nombre', cleanName);
                formData.append('usuario', user?.id || user?.pk || 1); 
                
                const hexList = colorsData.map(c => c.hex);
                formData.append('colores_hex', JSON.stringify(hexList));
                formData.append('colores_predominantes', JSON.stringify(colorsData)); 
                
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
                await capturaService.crearCaptura(formData);
                setIsSaved(true);
                setIsUpdatingName(true);
                Alert.alert("¡Éxito!", "Proyecto guardado en tu biblioteca.");
            }
            setShowSaveModal(false); 
        } catch (err) {
            Alert.alert("Error", err.message || "No se pudo procesar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoToEditor = () => {
        if (selectedIndices.length === 0) return Alert.alert("Aviso", "Selecciona al menos un color.");
        
        const selectedColors = selectedIndices.map(i => colorsData[i]);
        
        // CORRECCIÓN: Estructura exacta para el setPalette del ColorContext
        const newPalette = Array(5).fill(null).map((_, index) => {
            if (selectedColors[index]) {
                const hexVal = selectedColors[index].hex;
                const rgbVal = selectedColors[index].rgb;
                return {
                    id: index,
                    hex: hexVal,
                    rgb: rgbVal.includes('rgb') ? rgbVal : `rgb(${rgbVal})`,
                    filled: true
                };
            }
            return { id: index, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false };
        });
        
        // Enviamos la propiedad "palette" al contexto para evitar errores de guardado
        setPalette({ palette: newPalette }); 
        navigation.navigate('PaletteScanner'); 
    };

    const toggleColor = (index) => {
        if (mode !== 'combining') return;
        
        setSelectedIndices(prev => {
            if (prev.includes(index)) return prev.filter(i => i !== index);
            const limit = user?.is_premium ? 50 : 4; 
            if (prev.length >= limit) {
                Alert.alert("Límite alcanzado", `Como usuario ${user?.is_premium ? 'Premium' : 'Básico'} puedes seleccionar hasta ${limit} colores.`);
                return prev;
            }
            return [...prev, index];
        });
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>
                    {captureName ? captureName.toUpperCase() : "ANÁLISIS DE COLOR REAL"}
                </Text>
                
                <View style={styles.imageCard}>
                    {imageUri && <Image source={{ uri: imageUri }} style={styles.mainImage} resizeMode="cover" />}
                    <View style={styles.overlayTag}>
                        <Text style={styles.tagText}>IA ANALYZED</Text>
                    </View>
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>
                        {mode === 'combining' ? "SELECCIONA COLORES" : "COLORES PREDOMINANTES DETECTADOS"}
                    </Text>
                    
                    {colorsData.map((item, index) => (
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
                                    <View style={[styles.miniSquare, { backgroundColor: item.hex, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} />
                                    <View>
                                        <Text style={styles.hexText}>{item.hex.toUpperCase()}</Text>
                                        <Text style={styles.rgbText}>RGB: {item.rgb}</Text>
                                    </View>
                                </View>
                                <Text style={styles.percentText}>{item.percent}%</Text>
                            </View>
                            <View style={styles.barBackground}>
                                <View style={[styles.barFill, { backgroundColor: item.hex, width: `${item.percent}%` }]} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.buttonArea}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#69ED44" />
                    ) : mode === 'view' ? (
                        <>
                            <TouchableOpacity style={styles.btnAccent} onPress={() => setMode('combining')}>
                                <Text style={styles.btnTextGreen}>CREAR COMBINACIÓN</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.btnMain} 
                                onPress={() => setShowSaveModal(true)}
                            >
                                <Text style={styles.btnTextBlack}>
                                    {isUpdatingName ? "EDITAR NOMBRE" : "GUARDAR PROYECTO"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.btnSecondary} 
                                onPress={() => navigation.navigate('Scanner', { hideManual: true })}
                            >
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
                        <Text style={styles.modalTitle}>NOMBRE DEL PROYECTO</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ej: Mi Proyecto Pro" 
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
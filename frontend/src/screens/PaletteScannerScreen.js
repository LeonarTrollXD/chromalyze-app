import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    Alert, Platform, ActivityIndicator, Modal, TextInput, StatusBar 
} from 'react-native';
import { useColors } from '../context/ColorContext';
import { paletaService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaletteScannerScreen = ({ navigation, route }) => {
    const { 
        palette,           
        editingPalette, setEditingPalette 
    } = useColors(); 
    
    const [modalVisible, setModalVisible] = useState(false);
    const [nombrePaleta, setNombrePaleta] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [paletaId, setPaletaId] = useState(null);
    const [fechaOriginal, setFechaOriginal] = useState(null);
    const [fechaModificacion, setFechaModificacion] = useState(null);

    // Determinamos qué paleta mostrar
    const activePalette = (isEditing ? editingPalette : palette) || [];

    useEffect(() => {
        if (route.params?.paletaExistente) {
            const p = route.params.paletaExistente;
            setIsEditing(true);
            setPaletaId(p.id);
            setNombrePaleta(p.nombre);
            setFechaOriginal(p.created_at || p.fecha_creacion);
            setFechaModificacion(p.updated_at || null);
            
            const hexListFromDB = p.colores_hex || [];
            const restoredPalette = [0, 1, 2, 3, 4].map((idx) => {
                const hexColor = hexListFromDB[idx] || '#FFFFFF';
                return {
                    id: idx, 
                    hex: hexColor,
                    rgb: hexToRgb(hexColor),
                    filled: !!hexListFromDB[idx]
                };
            });
            setEditingPalette(restoredPalette);
        } else {
            setIsEditing(false);
            setNombrePaleta('');
        }
    }, [route.params]);

    const hexToRgb = (hex) => {
        if (!hex) return 'rgb(255, 255, 255)';
        try {
            const r = parseInt(hex.slice(1, 3), 16) || 255;
            const g = parseInt(hex.slice(3, 5), 16) || 255;
            const b = parseInt(hex.slice(5, 7), 16) || 255;
            return `rgb(${r}, ${g}, ${b})`;
        } catch (e) {
            return 'rgb(255, 255, 255)';
        }
    };

    const getContrastingColor = (hex) => {
        const color = (hex || '#FFFFFF').replace('#', '');
        const r = parseInt(color.substring(0, 2), 16) || 255;
        const g = parseInt(color.substring(2, 4), 16) || 255;
        const b = parseInt(color.substring(4, 6), 16) || 255;
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };

    const handleSaveProcess = async () => {
        if (!nombrePaleta.trim()) {
            return Alert.alert("Requerido", "Por favor ingresa un nombre para el proyecto.");
        }

        setLoading(true);
        try {
            const userDataRaw = await AsyncStorage.getItem('userData');
            const user = JSON.parse(userDataRaw);
            const userId = user?.id || user?.pk || user?.user?.id;
            
            const hexList = activePalette.map(slot => slot?.hex || "#FFFFFF");

            if (isEditing && paletaId) {
                await paletaService.actualizarPaleta(paletaId, {
                    nombre: nombrePaleta.trim(),
                    colores: hexList,
                    usuario: userId
                });
                Alert.alert("Actualizado", "Los cambios se guardaron correctamente.", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                await paletaService.guardarPaletaTecnica(
                    nombrePaleta.trim(), 
                    "MANUAL", 
                    hexList,
                    userId
                );
                Alert.alert("Guardado", "Paleta creada con éxito.", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            }
            setModalVisible(false);
        } catch (error) {
            const serverMsg = error.response?.data?.error || error.message;
            Alert.alert("Error", serverMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                {isEditing && fechaOriginal && (
                    <Text style={styles.topDateText}>
                        {fechaModificacion 
                            ? `ACTUALIZADO: ${new Date(fechaModificacion).toLocaleDateString()}` 
                            : `CREADO: ${new Date(fechaOriginal).toLocaleDateString()}`}
                    </Text>
                )}
                
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {nombrePaleta ? nombrePaleta.toUpperCase() : 'NUEVA COMBINACIÓN'}
                    </Text>
                    <TouchableOpacity 
                        style={styles.editNameIcon} 
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.pencilEmoji}>✏️</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statusBadge}>
                    <Text style={styles.subtitle}>
                        {isEditing ? 'MODO EDICIÓN' : 'EDITOR DE LABORATORIO'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {activePalette?.map((slot, index) => {
                    const currentSlot = slot || { id: index, hex: '#FFFFFF', rgb: 'rgb(255,255,255)' };
                    const textColor = getContrastingColor(currentSlot.hex);

                    return (
                        <View key={currentSlot.id || index} style={[styles.slotCard, { backgroundColor: currentSlot.hex }]}>
                            <View style={styles.slotInfo}>
                                <Text style={[styles.colorHex, { color: textColor }]}>
                                    {currentSlot.hex?.toUpperCase()}
                                </Text>
                                <Text style={[styles.colorRgb, { color: textColor, opacity: 0.7 }]}>
                                    {currentSlot.rgb}
                                </Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.editIconBtn, { borderColor: textColor + '40' }]}
                                onPress={() => navigation.navigate('ManualCreator', { 
                                    slotId: currentSlot.id,
                                    isEditingMode: isEditing 
                                })}
                            >
                                <Text style={[styles.editIcon, { color: textColor }]}>⚙️</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <View style={styles.footerActions}>
                    <TouchableOpacity 
                        style={[styles.mainBtn, isEditing ? styles.updateBtn : styles.saveBtn]} 
                        onPress={() => {
                            if (isEditing) {
                                handleSaveProcess();
                            } else {
                                setModalVisible(true);
                            }
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.btnTextBlack}>
                                {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR EN BIBLIOTECA'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>NOMBRE DEL PROYECTO</Text>
                        <TextInput 
                            style={styles.input} 
                            value={nombrePaleta}
                            onChangeText={setNombrePaleta}
                            placeholder="Ej: Mi Proyecto de Diseño"
                            placeholderTextColor="#666"
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalBtnCancel} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnTextWhite}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalBtnConfirm} 
                                onPress={handleSaveProcess}
                            >
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
    container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
    header: { marginTop: 60, marginBottom: 25 },
    topDateText: {
        color: '#69ED44',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    titleContainer: { flexDirection: 'row', alignItems: 'center' },
    title: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -1.2, flexShrink: 1 },
    editNameIcon: { marginLeft: 10, padding: 5 },
    pencilEmoji: { fontSize: 18 },
    statusBadge: { backgroundColor: '#1c1c1e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 10 },
    subtitle: { color: '#69ED44', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    scrollContainer: { paddingBottom: 40 },
    slotCard: {
        height: 100,
        borderRadius: 24,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    slotInfo: { flex: 1 },
    colorHex: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    colorRgb: { fontSize: 11, marginTop: 4, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    editIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    editIcon: { fontSize: 18 },
    footerActions: { marginTop: 10, gap: 12 },
    mainBtn: {
        paddingVertical: 20,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateBtn: { backgroundColor: '#69ED44' },
    saveAsBtn: { backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#3A3A3C' },
    btnTextBlack: { color: '#000', fontWeight: '900', fontSize: 15 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 25 },
    modalBox: { backgroundColor: '#1C1C1E', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: '#3A3A3C' },
    modalTitle: { color: '#FFF', textAlign: 'center', marginBottom: 20, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 18, borderRadius: 15, marginBottom: 25, fontSize: 16 },
    modalActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    modalBtnCancel: { flex: 1, alignItems: 'center' },
    modalBtnConfirm: { flex: 2, backgroundColor: '#69ED44', padding: 16, alignItems: 'center', borderRadius: 18 },
});

export default PaletteScannerScreen;
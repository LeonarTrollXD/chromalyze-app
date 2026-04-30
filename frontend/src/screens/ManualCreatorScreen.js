import 'react-native-gesture-handler';

import React, { useState } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ScrollView, Platform } from 'react-native';

import ColorPicker, { Panel1, HueSlider, RedSlider, GreenSlider, BlueSlider, Preview } from 'reanimated-color-picker';

import { runOnJS } from 'react-native-reanimated';



// 1. IMPORTAMOS EL CONTEXTO

import { useColors } from '../context/ColorContext';



const { height: SCREEN_HEIGHT } = Dimensions.get('window');



const hexToRgb = (hex) => {

    const r = parseInt(hex.slice(1, 3), 16);

    const g = parseInt(hex.slice(3, 5), 16);

    const b = parseInt(hex.slice(5, 7), 16);

    return { r, g, b };

};



const ManualCreatorScreen = ({ navigation, route }) => {

    const { slotId } = route.params || { slotId: 0 };

    const { palette, updateColor, resetColor } = useColors();



    const [hexText, setHexText] = useState(palette[slotId].hex);

    const [rgbValues, setRgbValues] = useState(hexToRgb(palette[slotId].hex));



    const updateState = (color) => {

        setHexText(color);

        setRgbValues(hexToRgb(color));

    };



    const onSelectColor = (event) => {

        'worklet';

        runOnJS(updateState)(event.hex);

    };



    const handleConfirm = () => {

        updateColor(slotId, hexText);

        navigation.goBack();

    };



    const handleReset = () => {

        resetColor(slotId);

        setHexText('#FFFFFF');

        setRgbValues({ r: 255, g: 255, b: 255 });

    };



    return (

        <View style={styles.container}>

            <StatusBar barStyle="light-content" />



            <View style={styles.previewSection}>

                <ColorPicker value={hexText} onComplete={onSelectColor}>

                    <Preview style={styles.fullPreview} hideText={true} />

                </ColorPicker>

               

                <View style={styles.overlay}>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>

                        <Text style={styles.whiteText}>←</Text>

                    </TouchableOpacity>

                   

                    <View style={styles.colorInfo}>

                        <Text style={[styles.hexValue, { color: hexText === '#FFFFFF' ? '#000' : '#FFF' }]}>

                            {hexText.toUpperCase()}

                        </Text>

                       

                        <View style={styles.rgbResultRow}>

                            <View style={styles.rgbBadge}><Text style={styles.rgbBadgeText}>R {rgbValues.r}</Text></View>

                            <View style={styles.rgbBadge}><Text style={styles.rgbBadgeText}>G {rgbValues.g}</Text></View>

                            <View style={styles.rgbBadge}><Text style={styles.rgbBadgeText}>B {rgbValues.b}</Text></View>

                        </View>

                    </View>

                </View>

            </View>



            <View style={styles.editCard}>

                {/* LA RAYITA (dragHandle) HA SIDO ELIMINADA DE AQUÍ */}

               

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                    <ColorPicker value={hexText} onComplete={onSelectColor}>

                       

                        <View style={styles.rowHeader}>

                            <Text style={styles.sectionTitle}>Selector de Espectro (Slot {slotId + 1})</Text>

                            <TouchableOpacity onPress={handleReset}>

                                <Text style={styles.resetText}>REINICIAR SLOT</Text>

                            </TouchableOpacity>

                        </View>



                        <View style={styles.boxContainer}>

                            <Panel1 style={styles.mainPanel} />

                            <HueSlider style={styles.hueBar} />

                        </View>



                        <View style={styles.divider} />



                        <Text style={styles.sectionTitle}>Ajuste Manual RGB</Text>

                        <View style={styles.rgbContainer}>

                            <View style={styles.sliderRow}>

                                <Text style={[styles.label, {color: '#FF453A'}]}>R</Text>

                                <RedSlider style={styles.flexSlider} />

                            </View>

                            <View style={styles.sliderRow}>

                                <Text style={[styles.label, {color: '#32D74B'}]}>G</Text>

                                <GreenSlider style={styles.flexSlider} />

                            </View>

                            <View style={styles.sliderRow}>

                                <Text style={[styles.label, {color: '#0A84FF'}]}>B</Text>

                                <BlueSlider style={styles.flexSlider} />

                            </View>

                        </View>

                    </ColorPicker>



                    <TouchableOpacity

                        style={styles.applyBtn}

                        onPress={handleConfirm}

                    >

                        <Text style={styles.applyText}>CONFIRMAR VALORES</Text>

                    </TouchableOpacity>

                </ScrollView>

            </View>

        </View>

    );

}; 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    previewSection: { height: SCREEN_HEIGHT * 0.35 },
    fullPreview: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    whiteText: { color: '#FFF', fontSize: 20 },
    colorInfo: { alignItems: 'center' },
    hexValue: { fontSize: 50, fontWeight: '900', letterSpacing: 2 },
    rgbResultRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    rgbBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    rgbBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    // Aumentamos un poco el paddingTop para compensar la falta de la raya
    editCard: { flex: 1, backgroundColor: '#121214', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 25, paddingTop: 30, marginTop: -30 },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#444', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
    resetText: { color: '#FF453A', fontSize: 11, fontWeight: 'bold' },
    boxContainer: { gap: 15, marginBottom: 30 },
    mainPanel: { height: 150, borderRadius: 20 },
    hueBar: { height: 25, borderRadius: 12 },
    divider: { height: 1, backgroundColor: '#1C1C1E', marginVertical: 10 },
    rgbContainer: { gap: 18, marginTop: 10 },
    sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    label: { width: 20, fontWeight: '900', fontSize: 16, textAlign: 'center' },
    flexSlider: { flex: 1, height: 35, borderRadius: 10 },
    applyBtn: { backgroundColor: '#69ED44', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 35 },
    applyText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});

export default ManualCreatorScreen;
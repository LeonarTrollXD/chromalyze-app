import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, PanResponder } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import ColorSlot from '../components/ColorSlot';

const { width } = Dimensions.get('window');
const BOX_SIZE = width - 80; 
const BOX_HEIGHT = 180;

const ManualCreatorScreen = ({ navigation }) => {
    // Paleta de colores
    const [colors, setColors] = useState(['#69ED44', '#1C1C1E', '#3A3A3C', '#8E8E93', '#FFFFFF']);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState('BOX'); // 'RGB' o 'BOX'
    
    // Estados para BOX mode (ESTADO MAESTRO)
    const [h, setH] = useState(105);
    const [s, setS] = useState(82);
    const [l, setL] = useState(60);
    
    // Estados para RGB mode (solo se usan en modo RGB)
    const [rRGB, setR] = useState(105);
    const [gRGB, setG] = useState(237);
    const [bRGB, setB] = useState(68);
    
    const lastS = useRef(82);
    const lastL = useRef(60);
    
    // Conversión HSL a RGB (para BOX mode)
    const hslToRgb = (nh, ns, nl) => {
        const s_n = ns / 100;
        const l_n = nl / 100;
        const k = n => (n + nh / 30) % 12;
        const a = s_n * Math.min(l_n, 1 - l_n);
        const f = n => l_n - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
    };
    
    // Conversión RGB a HSL
    const rgbToHsl = (nr, ng, nb) => {
        let r_norm = nr / 255, g_norm = ng / 255, b_norm = nb / 255;
        let max = Math.max(r_norm, g_norm, b_norm), min = Math.min(r_norm, g_norm, b_norm);
        let h, s, l = (max + min) / 2;
        
        if (max === min) { h = s = 0; } 
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r_norm: h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0); break;
                case g_norm: h = (b_norm - r_norm) / d + 2; break;
                case b_norm: h = (r_norm - g_norm) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };
    
    const rgbToHex = (nr, ng, nb) => {
        const toHex = (c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
        return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`.toUpperCase();
    };
    
    // Calcular valores según modo
    let hexValue, r, g, b, hslPreview;
    
    if (mode === 'RGB') {
        r = rRGB; g = gRGB; b = bRGB;
        hexValue = rgbToHex(r, g, b);
        hslPreview = rgbToHsl(r, g, b);
    } else {
        // BOX mode: RGB calculado desde HSL
        const [nr, ng, nb] = hslToRgb(h, s, l);
        r = nr; g = ng; b = nb;
        hexValue = rgbToHex(r, g, b);
        hslPreview = { h, s, l };
    }
    
    // Manejadores RGB (actualizan RGB y también sincronizan HSL para cuando vuelvas a BOX)
    const handleRChange = (newR) => {
        setR(Math.round(newR));
        // Sincronizar HSL desde RGB
        const { h: newH, s: newS, l: newL } = rgbToHsl(Math.round(newR), gRGB, bRGB);
        setH(newH);
        setS(newS);
        setL(newL);
        lastS.current = newS;
        lastL.current = newL;
    };
    
    const handleGChange = (newG) => {
        setG(Math.round(newG));
        const { h: newH, s: newS, l: newL } = rgbToHsl(rRGB, Math.round(newG), bRGB);
        setH(newH);
        setS(newS);
        setL(newL);
        lastS.current = newS;
        lastL.current = newL;
    };
    
    const handleBChange = (newB) => {
        setB(Math.round(newB));
        const { h: newH, s: newS, l: newL } = rgbToHsl(rRGB, gRGB, Math.round(newB));
        setH(newH);
        setS(newS);
        setL(newL);
        lastS.current = newS;
        lastL.current = newL;
    };
    
    // Manejadores BOX (TU CÓDIGO ORIGINAL - INTACTO)
    const handleManualUpdate = (x, y) => {
        const safeX = Math.max(0, Math.min(x, BOX_SIZE));
        const safeY = Math.max(0, Math.min(y, BOX_HEIGHT));
        const newS = Math.round((safeX / BOX_SIZE) * 100);
        const newL = Math.round(100 - (safeY / BOX_HEIGHT) * 100);
        setS(newS);
        setL(newL);
        lastS.current = newS;
        lastL.current = newL;
    };
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                handleManualUpdate(locationX, locationY);
            },
            onPanResponderMove: (evt, gestureState) => {
                const deltaS = (gestureState.dx / BOX_SIZE) * 100;
                const deltaL = (gestureState.dy / BOX_HEIGHT) * 100;
                let newS = lastS.current + deltaS;
                let newL = lastL.current - deltaL;
                const finalS = Math.max(0, Math.min(Math.round(newS), 100));
                const finalL = Math.max(0, Math.min(Math.round(newL), 100));
                setS(finalS);
                setL(finalL);
            },
            onPanResponderRelease: () => {
                lastS.current = s;
                lastL.current = l;
            },
            onPanResponderTerminationRequest: () => false,
        })
    ).current;
    
    // Actualizar paleta cuando cambia el color
    React.useEffect(() => {
        const newColors = [...colors];
        newColors[selectedIndex] = hexValue;
        setColors(newColors);
    }, [hexValue]);
    
    const renderSlider = (label, value, max, onChange, thumbColor, gradColors) => (
        <View style={styles.sliderRow}>
            <Text style={[styles.label, {color: thumbColor}]}>{label}</Text>
            <View style={styles.sliderWrap}>
                <LinearGradient colors={gradColors} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.gradLine} />
                <Slider 
                    style={styles.slider} 
                    minimumValue={0} 
                    maximumValue={max} 
                    value={value} 
                    onValueChange={onChange} 
                    minimumTrackTintColor="transparent" 
                    maximumTrackTintColor="transparent" 
                    thumbTintColor="#FFF" 
                />
            </View>
            <Text style={styles.valText}>{Math.round(value)}</Text>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.whiteText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>CHROMALYZE PRO</Text>
                <View style={{width: 40}} />
            </View>

            <View style={styles.previewBox}>
                <View style={[styles.largeCircle, { backgroundColor: hexValue }]} />
                <Text style={styles.hexText}>{hexValue}</Text>
                <Text style={styles.rgbText}>
                    RGB({r}, {g}, {b}) | HSL({hslPreview.h}°, {hslPreview.s}%, {hslPreview.l}%)
                </Text>
            </View>

            <View style={styles.modeTabs}>
                {['RGB', 'BOX'].map((m) => (
                    <TouchableOpacity 
                        key={m} 
                        style={[styles.tab, mode === m && styles.activeTab]} 
                        onPress={() => setMode(m)}
                    >
                        <Text style={[styles.tabText, mode === m && styles.activeTabText]}>{m}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.editorCard}>
                {mode === 'RGB' ? (
                    <View>
                        {renderSlider('R', rRGB, 255, handleRChange, '#FF4B4B', [`rgb(0,${gRGB},${bRGB})`, `rgb(255,${gRGB},${bRGB})`])}
                        {renderSlider('G', gRGB, 255, handleGChange, '#69ED44', [`rgb(${rRGB},0,${bRGB})`, `rgb(${rRGB},255,${bRGB})`])}
                        {renderSlider('B', bRGB, 255, handleBChange, '#4B9FFF', [`rgb(${rRGB},${gRGB},0)`, `rgb(${rRGB},${gRGB},255)`])}
                    </View>
                ) : (
                    <View style={styles.boxContainer}>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={360}
                            value={h}
                            onValueChange={(v) => setH(Math.round(v))}
                            thumbTintColor="#FFF"
                        />

                        <View
                            {...panResponder.panHandlers}
                            style={styles.gradientWrapper}
                            pointerEvents="box-only"
                        >
                            <View style={[styles.gradientBox, { backgroundColor: `hsl(${h}, 100%, 50%)` }]}>
                                <LinearGradient
                                    colors={['#FFF', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <LinearGradient
                                    colors={['transparent', '#000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View
                                    style={[
                                        styles.pickerCursor,
                                        {
                                            left: `${s}%`,
                                            top: `${100 - l}%`,
                                            backgroundColor: hexValue,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.paletteSection}>
                <Text style={styles.paletteTitle}>PALETA DE COLORES</Text>
                <View style={styles.slotsRow}>
                    {colors.map((c, i) => (
                        <ColorSlot 
                            key={i} 
                            color={c} 
                            isActive={selectedIndex === i} 
                            onPress={() => setSelectedIndex(i)} 
                        />
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.applyText}>CONFIRMAR COLOR</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
    header: { flexDirection: 'row', marginTop: 50, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
    title: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 2 },
    whiteText: { color: '#FFF', fontSize: 20 },
    previewBox: { alignItems: 'center', marginVertical: 20 },
    largeCircle: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, borderWidth: 3, borderColor: '#333' },
    hexText: { color: '#FFF', fontSize: 42, fontWeight: '900' },
    rgbText: { color: '#888', fontSize: 11, fontWeight: 'bold' },
    modeTabs: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 15, padding: 5, marginBottom: 15 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: '#222' },
    tabText: { color: '#444', fontWeight: 'bold', fontSize: 12 },
    activeTabText: { color: '#FFF' },
    editorCard: { backgroundColor: '#111', borderRadius: 25, padding: 20, minHeight: 260, justifyContent: 'center' },
    sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    label: { width: 25, fontWeight: 'bold', fontSize: 18 },
    sliderWrap: { flex: 1, height: 40, marginHorizontal: 10, justifyContent: 'center' },
    gradLine: { position: 'absolute', width: '100%', height: 8, borderRadius: 4 },
    slider: { width: '100%', height: 40 },
    valText: { color: '#FFF', width: 35, textAlign: 'right', fontSize: 12, fontWeight: 'bold' },
    boxContainer: { width: '100%', alignItems: 'center' },
    gradientWrapper: {
        width: BOX_SIZE,
        height: BOX_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 10,
        backgroundColor: '#000',
        borderWidth: 1.5,
        borderColor: '#444',
    },
    gradientBox: { width: '100%', height: '100%' },
    pickerCursor: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 4,
        borderColor: '#FFF',
        position: 'absolute',
        marginLeft: -16,
        marginTop: -16,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    paletteSection: { marginTop: 20 },
    paletteTitle: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
    slotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    applyBtn: { backgroundColor: '#FFF', padding: 18, borderRadius: 18, marginTop: 30, marginBottom: 30, alignItems: 'center' },
    applyText: { fontWeight: '900', color: '#000', letterSpacing: 1 }
});

export default ManualCreatorScreen;
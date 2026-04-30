import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    Alert,
    Modal 
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ConfigurationScreen = () => {
    const { user, logout } = useAuth();
    const [showSupportModal, setShowSupportModal] = useState(false);

    // Verifica si el usuario es Premium
    const isPremium = user?.rol?.nombre?.toUpperCase() === 'PREMIUM' || user?.es_premium;

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Salir", onPress: logout, style: "destructive" }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* --- MODAL DE APOYO --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSupportModal}
                onRequestClose={() => setShowSupportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¡Apóyanos!</Text>
                        <Text style={styles.modalDescription}>
                            Tu ayuda permite que Chromalyze siga creciendo. Escanea el código para colaborar:
                        </Text>
                        
                        {/* RUTA CORREGIDA: Accede a la raíz desde src/screens/ */}
                        <Image 
                            source={require('../../assets/qr.jpeg')} 
                            style={styles.largeSupportImage}
                            resizeMode="contain"
                        />

                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setShowSupportModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* SECCIÓN DE PERFIL */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.nombre || 'User') + '&background=69ED44&color=000' }} 
                        style={styles.avatar} 
                    />
                </View>
                <Text style={styles.userName}>{user?.nombre || 'Jhunnior'}</Text>
                <Text style={styles.userEmail}>{user?.correo || 'jhunnior@email.com'}</Text>
                
                <View style={[styles.planBadge, isPremium ? styles.premiumBadge : styles.basicBadge]}>
                    <Text style={[styles.planText, { color: isPremium ? '#000' : '#8E8E93' }]}>
                        {isPremium ? 'PLAN PREMIUM (BETA)' : 'PLAN BÁSICO'}
                    </Text>
                </View>
            </View>

            {/* SECCIÓN: PROYECTO (APOYO) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROYECTO</Text>
                <TouchableOpacity 
                    style={styles.supportCard} 
                    onPress={() => setShowSupportModal(true)}
                >
                    <View style={styles.supportContent}>
                        <Text style={styles.supportTitle}>Apóyanos</Text>
                        <Text style={styles.supportSub}>Ayuda a seguir mejorando Chromalyze</Text>
                    </View>
                    <Image 
                        source={require('../../assets/qr.jpeg')} 
                        style={styles.supportImage} 
                    />
                </TouchableOpacity>
            </View>

            {/* SECCIÓN DE CUENTA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MI CUENTA</Text>
                
                <TouchableOpacity 
                    style={styles.row} 
                    onPress={() => Alert.alert("Próximamente", "Interfaz Premium en desarrollo.")}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.rowLabel, { color: '#69ED44', fontWeight: 'bold' }]}>
                            Subir a Premium
                        </Text>
                        <Text style={styles.devText}>[Interfaz en desarrollo]</Text>
                    </View>
                    <View style={styles.newBadge}>
                        <Text style={styles.newText}>PRO</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.row, styles.logoutRow]} 
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.versionText}>Versión 1.0.0 Beta</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        padding: 25,
        width: '90%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3a3a3c'
    },
    modalTitle: {
        color: '#69ED44',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10
    },
    modalDescription: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20
    },
    largeSupportImage: {
        width: 250,
        height: 250,
        borderRadius: 15,
        marginBottom: 25,
        backgroundColor: '#fff',
    },
    closeButton: {
        backgroundColor: '#69ED44',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10
    },
    closeButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#1c1c1e',
    },
    avatarContainer: { 
        marginBottom: 15 
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#69ED44',
    },
    userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    userEmail: { color: '#8e8e93', fontSize: 14, marginTop: 4 },
    planBadge: { 
        marginTop: 15, 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 20 
    },
    basicBadge: { backgroundColor: '#1c1c1e' },
    premiumBadge: { backgroundColor: '#69ED44' },
    planText: { fontSize: 12, fontWeight: 'bold' },
    section: { marginTop: 25, paddingHorizontal: 20 },
    sectionTitle: { 
        color: '#8e8e93', 
        fontSize: 13, 
        marginBottom: 10, 
        marginLeft: 5, 
        letterSpacing: 1 
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1c1c1e',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    rowLabel: { color: '#fff', fontSize: 16 },
    supportCard: {
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    supportContent: { flex: 1 },
    supportTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    supportSub: { color: '#8e8e93', fontSize: 12, marginTop: 4 },
    supportImage: { 
        width: 50, 
        height: 50, 
        borderRadius: 8, 
        marginLeft: 10, 
        backgroundColor: '#fff' 
    },
    devText: { color: '#636366', fontSize: 11, fontStyle: 'italic' },
    newBadge: { backgroundColor: '#69ED44', paddingHorizontal: 6, borderRadius: 4 },
    newText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    logoutRow: { marginTop: 10, justifyContent: 'center' },
    logoutText: { color: '#ff453a', fontSize: 16, fontWeight: 'bold' },
    versionText: { 
        textAlign: 'center', 
        color: '#3a3a3c', 
        fontSize: 12, 
        marginVertical: 30 
    }
});

export default ConfigurationScreen;
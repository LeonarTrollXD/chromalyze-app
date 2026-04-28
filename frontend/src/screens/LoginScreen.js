import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform,
    StatusBar,
    ScrollView
} from 'react-native';
import { useAuth } from '../hook/useAuth'; 

const LoginScreen = ({ navigation }) => { 
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { executeLogin } = useAuth();

    const handleLogin = async () => {
        // Validaciones básicas
        if (!correo.trim() || !password.trim()) {
            Alert.alert("Chromalyze", "Por favor completa todos los campos.");
            return;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(correo)) {
            Alert.alert("Formato inválido", "Ingresa un correo electrónico válido.");
            return;
        }
        
        setLoading(true);
        try {
            // Se envía el correo en minúsculas y sin espacios
            const result = await executeLogin(correo.toLowerCase().trim(), password.trim());
            
            if (result && result.success) {
                // EXPLICACIÓN TÉCNICA:
                // No llamamos a navigation.navigate('MainApp').
                // Al ejecutarse el login exitoso en el Contexto, 'isAuthenticated' cambia a TRUE.
                // El AppNavigator reacciona y cambia el Stack automáticamente.
                console.log("Login exitoso, el Navegador cambiará automáticamente.");
            } else {
                Alert.alert("Acceso Denegado", result?.error || "Credenciales incorrectas.");
                setPassword(''); 
            }
        } catch (err) {
            Alert.alert("Error de Conexión", "No se pudo conectar con el servidor.");
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView 
                contentContainerStyle={styles.scrollContainer} 
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* --- HEADER / BRANDING --- */}
                <View style={styles.brandContainer}>
                    <Text style={styles.brandTitle}>Chromalyze</Text>
                    <Text style={styles.brandSubtitle}>Identificador de Color</Text>
                    <View style={styles.sloganLine}>
                        <Text style={styles.sloganText}>Captura la esencia cromática</Text>
                    </View>
                </View>

                {/* --- FORMULARIO --- */}
                <View style={styles.loginCard}>
                    <Text style={styles.loginTitle}>INICIAR SESIÓN</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="usuario@chromalyze.com"
                            placeholderTextColor="#444"
                            value={correo}
                            onChangeText={setCorreo}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CONTRASEÑA</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#444"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>ACCEDER AL SISTEMA</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* --- NAVEGACIÓN A REGISTRO --- */}
                <TouchableOpacity 
                   onPress={() => navigation.navigate('Register')} 
                   style={styles.registerLink}
                   disabled={loading}
                 >
                    <Text style={styles.registerText}>
                        ¿Nuevo en la plataforma? <Text style={styles.registerBold}>Crea una cuenta</Text>
                    </Text>
                </TouchableOpacity>

                {/* --- PIE DE PÁGINA --- */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>UNIVERSIDAD SISTEMAS • 2026</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0B' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 50 },
    brandContainer: { alignItems: 'center', marginBottom: 50 },
    brandTitle: { color: '#FFF', fontSize: 42, fontWeight: '200', letterSpacing: 4 },
    brandSubtitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', fontStyle: 'italic', marginTop: 5 },
    sloganLine: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 10 },
    sloganText: { color: '#666', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
    loginCard: { backgroundColor: '#161618', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: '#2C2C2E' },
    loginTitle: { color: '#69ED44', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 30, letterSpacing: 2 },
    inputGroup: { marginBottom: 20 },
    label: { color: '#8E8E93', fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
    input: { 
        backgroundColor: '#0A0A0B', 
        borderRadius: 18, 
        padding: 20, 
        fontSize: 16, 
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#2C2C2E'
    },
    button: { 
        backgroundColor: '#FFF', 
        borderRadius: 18, 
        padding: 20, 
        alignItems: 'center', 
        marginTop: 20,
        shadowColor: '#69ED44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5 
    },
    buttonDisabled: { backgroundColor: '#555' },
    buttonText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    registerLink: { marginTop: 40, alignItems: 'center' },
    registerText: { color: '#636363', fontSize: 14 },
    registerBold: { fontWeight: 'bold', color: '#FFF' },
    footer: { marginTop: 60, alignItems: 'center' },
    footerText: { color: '#2C2C2E', fontSize: 10, fontWeight: 'bold', letterSpacing: 3 }
});

export default LoginScreen;
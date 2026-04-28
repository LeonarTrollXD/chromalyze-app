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

const RegisterScreen = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { executeRegister } = useAuth(); 

    const handleRegister = async () => {
        // 1. VALIDACIONES INICIALES
        if (!nombre.trim() || !correo.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert("Chromalyze", "Todos los campos son obligatorios.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            Alert.alert(
                "Seguridad de Cuenta", 
                "Tu contraseña debe tener:\n\n• Mínimo 8 caracteres\n• Al menos una letra\n• Al menos un número o símbolo"
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Seguridad", "Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            // 2. EJECUCIÓN DEL REGISTRO
            const response = await executeRegister(nombre.trim(), correo.toLowerCase().trim(), password);
            
            // 3. VALIDACIÓN CRÍTICA (Para evitar falsos éxitos)
            // Si el hook devuelve success: false o no devuelve nada, lanzamos error
            if (!response || response.success === false) {
                const errorMsg = response?.error || "Este correo ya está vinculado a otra cuenta.";
                throw new Error(errorMsg);
            }
            
            // 4. ÉXITO REAL
            Alert.alert(
                "¡Bienvenido!", 
                "Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión.",
                [{ 
                    text: "IR AL LOGIN", 
                    onPress: () => navigation.navigate('Login') 
                }]
            );

        } catch (error) {
            // 5. CAPTURA DE ERRORES REALES
            // Aquí caerá si el correo ya existe o si el servidor falló
            Alert.alert("Aviso de Registro", error.message);
            
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
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                
                <View style={styles.header}>
                    <Text style={styles.brandTitle}>Chromalyze</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>SISTEMA DE REGISTRO</Text>
                    </View>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.stepTitle}>CREA TU PERFIL PROFESIONAL</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>NOMBRE COMPLETO</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Ej. Juan Pérez"
                            placeholderTextColor="#444"
                            value={nombre}
                            onChangeText={setNombre}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL INSTITUCIONAL</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="usuario@correo.com"
                            placeholderTextColor="#444"
                            value={correo}
                            onChangeText={setCorreo}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CONTRASEÑA SEGURA</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Mínimo 8 caracteres"
                            placeholderTextColor="#444"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Repite tu contraseña"
                            placeholderTextColor="#444"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.mainButton, loading && styles.buttonDisabled]} 
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>CREAR CUENTA</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('Login')} 
                    style={styles.loginLink}
                    disabled={loading}
                >
                    <Text style={styles.loginText}>
                        ¿Ya eres miembro? <Text style={styles.loginBold}>Identifícate aquí</Text>
                    </Text>
                </TouchableOpacity>

                <Text style={styles.academicFooter}>PROYECTO INGENIERÍA DE SISTEMAS • 2026</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0B' },
    scrollContainer: { flexGrow: 1, paddingHorizontal: 30, paddingVertical: 40, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 35 },
    brandTitle: { color: '#FFF', fontSize: 32, fontWeight: '200', letterSpacing: 4 },
    badge: { backgroundColor: '#1C1C1E', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 5, marginTop: 10, borderWidth: 1, borderColor: '#333' },
    badgeText: { color: '#69ED44', fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5 },
    formCard: { backgroundColor: '#161618', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: '#2C2C2E' },
    stepTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 25, letterSpacing: 1 },
    inputGroup: { marginBottom: 15 },
    label: { color: '#636366', fontSize: 9, fontWeight: 'bold', marginBottom: 8, marginLeft: 5, letterSpacing: 1 },
    input: { 
        backgroundColor: '#0A0A0B', borderRadius: 15, padding: 16, 
        fontSize: 15, color: '#FFF', borderWidth: 1, borderColor: '#2C2C2E'
    },
    mainButton: { 
        backgroundColor: '#FFF', borderRadius: 18, padding: 18, 
        alignItems: 'center', marginTop: 15, shadowColor: '#69ED44',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    buttonDisabled: { backgroundColor: '#444' },
    buttonText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    loginLink: { marginTop: 30, alignItems: 'center' },
    loginText: { color: '#636366', fontSize: 13 },
    loginBold: { fontWeight: 'bold', color: '#FFF' },
    academicFooter: { color: '#2C2C2E', fontSize: 9, textAlign: 'center', marginTop: 40, fontWeight: 'bold', letterSpacing: 2 }
});

export default RegisterScreen;
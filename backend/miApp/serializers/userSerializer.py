import re
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema_field
from ..models.usuario import Usuario
from ..models.rol import Rol

class UserSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.SerializerMethodField()
    token = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'password', 
            'rol', 'rol_nombre', 'token', 'fecha_registro'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'rol': {'required': False},
            'nombre': {'required': True}
        }
        read_only_fields = ['id', 'fecha_registro']

    @extend_schema_field(serializers.CharField())
    def get_rol_nombre(self, obj):
        return str(obj.rol.nombre) if obj.rol else "Sin Rol"

    @extend_schema_field(serializers.CharField())
    def get_token(self, obj):
        if obj.id:
            token, _ = Token.objects.get_or_create(user=obj)
            return token.key
        return None

    # --- VALIDACIÓN DE CORREO DUPLICADO ---
    def validate_correo(self, value):
        email = value.lower().strip()
        if Usuario.objects.filter(correo=email).exists():
            raise serializers.ValidationError("Este correo ya está registrado. Intenta iniciar sesión.")
        return email

    # --- VALIDACIÓN PROFESIONAL DE CONTRASEÑA ---
    def validate_password(self, value):
        # 1. Longitud mínima de 8
        if len(value) < 8:
            raise serializers.ValidationError("La contraseña debe tener al menos 8 caracteres.")
        
        # 2. Debe contener al menos un número o un carácter especial
        # Esta regex busca: que NO sean solo letras
        if not re.search(r'[0-9!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("La contraseña debe incluir al menos un número o un carácter especial.")
        
        # 3. Debe contener al menos una letra (para que no sean solo números)
        if not re.search(r'[a-zA-Z]', value):
            raise serializers.ValidationError("La contraseña debe incluir al menos una letra.")
            
        return value

    def create(self, validated_data):
        # Extraemos password y correo (usamos .pop() para evitar el error de argumentos duplicados)
        password = validated_data.pop('password', None)
        correo = validated_data.pop('correo') 
        
        # Si el rol viene como None, lo quitamos para usar el default del Manager
        if 'rol' in validated_data and validated_data['rol'] is None:
            validated_data.pop('rol')

        # Creamos el usuario
        user = Usuario.objects.create_user(
            correo=correo,
            password=password,
            **validated_data
        )

        # Generamos el token
        Token.objects.get_or_create(user=user)
        
        return user
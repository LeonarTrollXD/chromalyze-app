from rest_framework import serializers
from ..models.rol import Rol

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion']
        read_only_fields = ['id']

    def validate_nombre(self, value):
        # 1. Normalización a mayúsculas
        nombre_mayus = value.upper().strip()
        
        # 2. Verificación de existencia SEGURA
        queryset = Rol.objects.filter(nombre__iexact=nombre_mayus)
        
        # IMPORTANTE: Si estamos editando (self.instance existe), 
        # excluimos el registro actual de la búsqueda.
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
            
        if queryset.exists():
            raise serializers.ValidationError(f"El rol '{nombre_mayus}' ya existe.")
            
        return nombre_mayus
from rest_framework import serializers
from ..models.color import Color

class ColorSerializer(serializers.ModelSerializer):
    # Ya NO definimos 'porcentaje' aquí porque no existe en el modelo Color
    # Solo dejamos los campos técnicos de la Biblioteca Maestra.

    class Meta:
        model = Color
        # Campos EXACTOS que tienes en tu modelo Color
        fields = [
            'id', 
            'nombre', 
            'hex_code', 
            'r', 
            'g', 
            'b', 
            'rgb_code'
        ]
        
        extra_kwargs = {
            'id': {'read_only': True},
            'r': {'read_only': True},
            'g': {'read_only': True},
            'b': {'read_only': True},
            'rgb_code': {'read_only': True},
        }

    def hex_to_rgb(self, hex_value):
        """Convierte #FFFFFF a (255, 255, 255) de forma segura"""
        try:
            hex_value = hex_value.lstrip('#')
            if len(hex_value) == 3:
                hex_value = ''.join([c*2 for c in hex_value])
            return tuple(int(hex_value[i:i+2], 16) for i in (0, 2, 4))
        except Exception:
            return (0, 0, 0)

    def create(self, validated_data):
        hex_code = validated_data.get('hex_code', '#000000')
        
        # Si el frontend no envía los valores R,G,B, los calculamos automáticamente
        # para mantener la integridad de la Biblioteca Maestra.
        r, g, b = self.hex_to_rgb(hex_code)
        validated_data['r'] = r
        validated_data['g'] = g
        validated_data['b'] = b
        
        # Sincronizamos el string rgb_code para que se guarde como "255,255,255"
        validated_data['rgb_code'] = f"{r},{g},{b}"
        
        return super().create(validated_data)
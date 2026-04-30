from rest_framework import serializers
from ..models.paleta import Paleta, ComposicionPaleta
from ..models.color import Color
from ..models.usuario import Usuario

class PaletaSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para visualización
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)
    colores_hex = serializers.SerializerMethodField(read_only=True)
    
    # Campo para la foto de fondo en la biblioteca
    captura_image_url = serializers.SerializerMethodField(read_only=True)
    
    # Definimos usuario explícitamente
    usuario = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=True
    )

    class Meta:
        model = Paleta
        fields = [
            'id', 'nombre', 'origen', 'origen_display', 
            'colores', 'colores_hex', 'usuario', 
            'usuario_nombre', 'fecha_creacion',
            'captura_image_url',
            'captura' # CRUCIAL: Debe estar aquí para que el frontend reciba el ID de la imagen
        ]
        # 'colores' es read_only porque se gestiona manualmente
        read_only_fields = ['id', 'fecha_creacion', 'origen_display', 'colores']

    def get_captura_image_url(self, obj):
        """
        Extrae la URL completa de la imagen. 
        Maneja errores si la relación 'captura' no existe.
        """
        try:
            if obj.captura and obj.captura.imagen:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.captura.imagen.url)
                return obj.captura.imagen.url
        except Exception:
            return None
        return None

    def get_colores_hex(self, obj):
        """
        Devuelve los códigos HEX en el orden correcto de creación.
        """
        try:
            # Usamos la tabla intermedia para asegurar el orden si tienes un ID o fecha ahí
            return [c.color.hex_code for c in obj.composicionpaleta_set.all().order_id('id')]
        except:
            # Fallback si falla la relación inversa
            return [c.hex_code for c in obj.colores.all()]

    def validate(self, data):
        """
        Validación de límite de paletas para usuarios con Plan Básico.
        """
        usuario = data.get('usuario')
        # Solo validamos al crear (si no hay instancia previa)
        if not self.instance and usuario:
            # Plan Básico (ID 2)
            if hasattr(usuario, 'rol') and usuario.rol.id == 2:
                if Paleta.objects.filter(usuario=usuario).count() >= 3:
                    raise serializers.ValidationError({
                        "usuario": "Límite alcanzado: El plan Básico solo permite 3 paletas."
                    })
        return data

    def _gestionar_colores(self, paleta, colores_hex):
        """
        Método interno para limpiar y recrear la composición de colores.
        """
        if not isinstance(colores_hex, list):
            colores_hex = []
        
        # Asegurar 5 colores (Relleno con blanco si falta)
        while len(colores_hex) < 5:
            colores_hex.append("#FFFFFF")
        
        colores_finales = colores_hex[:5]

        # Limpiar colores previos si es una actualización
        ComposicionPaleta.objects.filter(paleta=paleta).delete()

        for hex_val in colores_finales:
            clean_hex = hex_val if hex_val.startswith('#') else f"#{hex_val}"
            
            color_obj, _ = Color.objects.get_or_create(
                hex_code=clean_hex,
                defaults={
                    'nombre': f'Color {clean_hex}',
                    'r': 255, 'g': 255, 'b': 255,
                    'rgb_code': '255,255,255'
                }
            )

            ComposicionPaleta.objects.create(
                paleta=paleta,
                color=color_obj,
                porcentaje=20
            )

    def create(self, validated_data):
        """
        Crea la paleta y asigna los colores enviados en el request.
        """
        request_data = self.context['request'].data
        colores_enviados = request_data.get('colores_hex', [])

        paleta = Paleta.objects.create(**validated_data)
        self._gestionar_colores(paleta, colores_enviados)
        
        return paleta

    def update(self, instance, validated_data):
        """
        Permite actualizar el nombre de la paleta y sus colores.
        """
        request_data = self.context['request'].data
        colores_enviados = request_data.get('colores_hex')

        # Actualizar campos básicos (nombre, etc)
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.save()

        # Si se enviaron colores, actualizar la tabla intermedia
        if colores_enviados is not None:
            self._gestionar_colores(instance, colores_enviados)

        return instance
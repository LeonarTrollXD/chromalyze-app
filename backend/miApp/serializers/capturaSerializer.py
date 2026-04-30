import json
from rest_framework import serializers
from django.db import transaction
from ..models.captura import Captura

class CapturaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    # CharField para recibir desde FormData sin que truene el JSON
    colores_predominantes = serializers.CharField(write_only=True, required=False, allow_null=True)
    colores_hex = serializers.JSONField(read_only=True)

    class Meta:
        model = Captura
        fields = [
            'id', 'nombre', 'imagen', 'fecha_captura', 
            'usuario', 'usuario_nombre', 'colores_predominantes', 'colores_hex'
        ]
        read_only_fields = ['id', 'fecha_captura', 'colores_hex']

    def get_usuario_nombre(self, obj):
        if obj.usuario and hasattr(obj.usuario, 'nombre'):
            return obj.usuario.nombre
        return "Usuario Desconocido"

    def validate(self, data):
        usuario = data.get('usuario')
        nombre = data.get('nombre')
        
        # --- 1. VALIDACIÓN DE LÍMITE (PLAN BÁSICO / PREMIUM EN DESARROLLO) ---
        # Solo aplicamos el límite si es una creación nueva (no hay self.instance)
        if usuario and not self.instance:
            conteo = Captura.objects.filter(usuario=usuario).count()
            if conteo >= 3:
                raise serializers.ValidationError({
                    "limite": "Máximo 3 capturas, el plan Premium y su interfaz aún están en desarrollo, próximamente guardado ilimitado ¡Pronto podrás suscribirte!"
                })

        # --- 2. VALIDACIÓN DE NOMBRE DUPLICADO ---
        if usuario and nombre:
            queryset = Captura.objects.filter(usuario=usuario, nombre__iexact=nombre)
            
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    "detalle": "Ya tienes un proyecto con este nombre."
                })
                
        return data

    def create(self, validated_data):
        # El ViewSet se encarga de la lógica pesada de colores
        validated_data.pop('colores_predominantes', None)
        with transaction.atomic():
            return Captura.objects.create(**validated_data)

    def update(self, instance, validated_data):
        datos_colores = validated_data.pop('colores_predominantes', None)
        
        # Intentar parsear colores si vienen como string desde FormData
        if isinstance(datos_colores, str) and datos_colores.strip():
            try:
                datos_colores = json.loads(datos_colores)
            except:
                datos_colores = []

        with transaction.atomic():
            # Actualizar campos básicos
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            # Si hay nuevos colores, sincronizar con tablas relacionales
            if datos_colores:
                instance.colores_hex = datos_colores
                self.sincronizar_biblioteca_y_paleta(instance, datos_colores)
            
            instance.save()
            return instance

    def sincronizar_biblioteca_y_paleta(self, captura, lista_colores):
        from ..models.paleta import Paleta, ComposicionPaleta
        from ..models.color import Color

        if not lista_colores or not isinstance(lista_colores, list):
            return

        # 1. Asegurar existencia de la Paleta
        paleta, _ = Paleta.objects.get_or_create(
            captura=captura,
            usuario=captura.usuario,
            defaults={
                'nombre': f"Paleta: {captura.nombre or 'Sin nombre'}", 
                'origen': 'CAMARA'
            }
        )

        # 2. Reemplazar composición anterior por la nueva
        ComposicionPaleta.objects.filter(paleta=paleta).delete()

        for item in lista_colores:
            hex_val = str(item.get('hex', '')).upper().strip()
            if not hex_val: continue

            # Asegurar que el color existe en la biblioteca maestra
            color_obj, _ = Color.objects.get_or_create(
                hex_code=hex_val,
                defaults={
                    'nombre': f"Color {hex_val}", 
                    'rgb_code': item.get('rgb', '')
                }
            )

            # Obtener porcentaje
            p_raw = item.get('percent', item.get('porcentaje', 1))
            try:
                p_real = int(float(p_raw))
            except (ValueError, TypeError):
                p_real = 1

            ComposicionPaleta.objects.create(
                paleta=paleta,
                color=color_obj,
                porcentaje=max(1, p_real)
            )
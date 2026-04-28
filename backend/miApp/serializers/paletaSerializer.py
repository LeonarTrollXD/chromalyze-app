from rest_framework import serializers
from ..models.paleta import Paleta
from ..models.color import Color

class PaletaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    origen_display = serializers.CharField(source='get_origen_display', read_only=True)
    
    colores = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Color.objects.all(),
        help_text="Lista de 4 IDs de colores para la paleta"
    )

    class Meta:
        model = Paleta
        fields = [
            'id', 
            'nombre', 
            'origen', 
            'origen_display', 
            'colores', 
            'usuario', 
            'usuario_nombre', 
            'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'origen_display']

    def validate(self, data):
        """
        Validación integral: Límites por plan y nombres únicos por colección personal.
        """
        usuario = data.get('usuario')
        nombre = data.get('nombre')
        
        # --- LOGICA 1: LÍMITE DE PALETAS SEGÚN ROL ---
        conteo_paletas = Paleta.objects.filter(usuario=usuario).count()
        rol_nombre = usuario.rol.nombre.upper()

        if "BASICO" in rol_nombre and conteo_paletas >= 3:
            raise serializers.ValidationError({
                "usuario": f"Límite alcanzado: Como usuario Básico solo puedes tener 3 paletas. ¡Pásate a Premium!"
            })

        # --- LOGICA 2: NOMBRE ÚNICO SOLO PARA ESTE USUARIO ---
        if Paleta.objects.filter(usuario=usuario, nombre=nombre).exists():
            raise serializers.ValidationError({
                "nombre": f"Ya tienes una paleta guardada como '{nombre}'. Elige un nombre distinto para tu colección personal."
            })

        return data

    def validate_colores(self, value):
        """
        Validación de estructura de la paleta.
        """
        if len(value) != 4:
            raise serializers.ValidationError("Una paleta debe tener exactamente 4 colores.")
        
        if len(set(value)) != len(value):
            raise serializers.ValidationError("No puedes repetir el mismo color en la paleta.")
            
        return value
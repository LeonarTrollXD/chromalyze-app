from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from ..models.paleta import Paleta, ComposicionPaleta
from ..models.color import Color
from ..serializers.paletaSerializer import PaletaSerializer

class PaletaViewSet(viewsets.ModelViewSet):
    queryset = Paleta.objects.all()
    serializer_class = PaletaSerializer

    def create(self, request, *args, **kwargs):
        # 1. Obtener datos del request
        user_id = request.data.get('usuario')
        colores_hex = request.data.get('colores_hex', [])
        nombre = request.data.get('nombre', '').strip()
        origen = request.data.get('origen', 'MANUAL').upper()

        # 2. VALIDACIÓN: Nombre repetido para el mismo usuario
        if Paleta.objects.filter(usuario_id=user_id, nombre__iexact=nombre).exists():
            return Response(
                {"error": "Ya tienes un proyecto con este nombre."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. BLOQUEO DE SEGURIDAD FILTRADO POR ORIGEN (Plan Básico)
        if origen == 'MANUAL':
            conteo_manual = Paleta.objects.filter(usuario_id=user_id, origen='MANUAL').count()
            print(f"DEBUG: Usuario {user_id} tiene {conteo_manual} paletas MANUALES.")

            if conteo_manual >= 3:
                mensaje_marketing = (
                    "Máximo 3 paletas, el plan Premium y su interfaz aún están en desarrollo, próximamente guardado ilimitado."
                )
                return Response(
                    {"error": mensaje_marketing}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 4. Proceso de creación
        try:
            with transaction.atomic():
                nueva_paleta = Paleta.objects.create(
                    nombre=nombre,
                    origen=origen,
                    usuario_id=user_id
                )

                for hex_code in colores_hex:
                    clean_hex = hex_code.strip().upper()
                    if not clean_hex.startswith('#'):
                        clean_hex = f"#{clean_hex}"
                        
                    color_obj, _ = Color.objects.get_or_create(hex_code=clean_hex)
                    
                    ComposicionPaleta.objects.create(
                        paleta=nueva_paleta,
                        color=color_obj,
                        porcentaje=0
                    )

                serializer = self.get_serializer(nueva_paleta)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ ERROR EN CREACIÓN: {str(e)}")
            return Response({"error": "No se pudo procesar la solicitud de guardado."}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Extraemos datos del cuerpo de la petición
        user_id = request.data.get('usuario', instance.usuario_id)
        nombre = request.data.get('nombre', instance.nombre).strip()
        colores_hex = request.data.get('colores_hex')

        # 1. VALIDACIÓN: Nombre repetido (excluyendo la paleta actual)
        nombre_repetido = Paleta.objects.filter(
            usuario_id=user_id, 
            nombre__iexact=nombre
        ).exclude(id=instance.id).exists()

        if nombre_repetido:
            return Response(
                {"error": "Ya tienes un proyecto con este nombre."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Proceso de actualización
        try:
            with transaction.atomic():
                # Actualizar datos básicos
                instance.nombre = nombre
                instance.save()

                # 3. Si se enviaron colores, reemplazamos la composición
                if colores_hex is not None:
                    # Limpiamos relaciones anteriores
                    ComposicionPaleta.objects.filter(paleta=instance).delete()

                    # Registramos los nuevos colores
                    for hex_code in colores_hex:
                        clean_hex = hex_code.strip().upper()
                        if not clean_hex.startswith('#'):
                            clean_hex = f"#{clean_hex}"
                        
                        color_obj, _ = Color.objects.get_or_create(hex_code=clean_hex)
                        
                        ComposicionPaleta.objects.create(
                            paleta=instance,
                            color=color_obj,
                            porcentaje=0
                        )

                serializer = self.get_serializer(instance)
                return Response(serializer.data)

        except Exception as e:
            print(f"❌ ERROR EN ACTUALIZACIÓN: {str(e)}")
            return Response({"error": "No se pudo actualizar la paleta."}, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        queryset = Paleta.objects.all()
        user_id = self.request.query_params.get('usuario')
        if user_id:
            queryset = queryset.filter(usuario_id=user_id)
        return queryset
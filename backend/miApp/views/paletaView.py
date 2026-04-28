from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

# Importaciones relativas según tu estructura
from ..models.paleta import Paleta
from ..models.usuario import Usuario
from ..serializers.paletaSerializer import PaletaSerializer

class PaletaViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para Paletas de Colores con validación de límite de 3 para usuarios estándar.
    """
    queryset = Paleta.objects.all()
    serializer_class = PaletaSerializer

    @extend_schema(
        summary="Crear una nueva paleta",
        description="Valida que si el usuario tiene Rol ID 2, no supere las 3 paletas guardadas."
    )
    def create(self, request, *args, **kwargs):
        # 1. Obtención del usuario desde los datos enviados
        user_id = request.data.get('usuario')
        
        try:
            user = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        # 2. Lógica de Negocio: Validación de límite (Rol 2 = Estándar)
        if user.rol.id == 2:
            conteo = Paleta.objects.filter(usuario=user).count()
            if conteo >= 3:
                return Response(
                    {"error": "Límite de 3 paletas alcanzado. ¡Pásate a PREMIUM para crear infinitas!"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # 3. Proceder con la creación estándar si pasa la validación
        return super().create(request, *args, **kwargs)

    @extend_schema(summary="Listar todas las paletas")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Eliminar una paleta (ID)")
    def destroy(self, request, *args, **kwargs):
        # Habilita el botón DELETE en Swagger
        return super().destroy(request, *args, **kwargs)

    @extend_schema(summary="Actualizar nombre o colores de una paleta (ID)")
    def update(self, request, *args, **kwargs):
        # Habilita el botón PUT/PATCH en Swagger
        return super().update(request, *args, **kwargs)
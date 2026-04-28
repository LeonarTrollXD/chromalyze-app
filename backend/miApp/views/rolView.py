from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

# Importaciones relativas según tu estructura
from ..models.rol import Rol
from ..serializers.rolSerializer import RolSerializer

class RolViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para la gestión de Roles.
    Permite administrar los niveles de acceso (User, Pro, Admin) del sistema.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

    @extend_schema(
        summary="Listar todos los roles",
        description="Retorna la lista completa de roles definidos para los usuarios."
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear un nuevo rol",
        description="Añade un nuevo tipo de rol a la base de datos."
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary="Eliminar un rol específico (ID)")
    def destroy(self, request, *args, **kwargs):
        # Esto habilita el botón rojo de DELETE en Swagger
        return super().destroy(request, *args, **kwargs)

    @extend_schema(summary="Actualizar nombre o descripción de un rol (ID)")
    def update(self, request, *args, **kwargs):
        # Esto habilita los botones PUT/PATCH en Swagger
        return super().update(request, *args, **kwargs)
from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from miApp.models.color import Color 
from miApp.serializers.colorSerializer import ColorSerializer

class ColorViewSet(viewsets.ModelViewSet):
    """
    CRUD para Colores.
    Gestiona la persistencia de colores extraídos de imágenes.
    """
    queryset = Color.objects.all().order_by('-id') # Los últimos guardados primero
    serializer_class = ColorSerializer

    @extend_schema(
        summary="Registrar color",
        description="Guarda un color asociado a una captura. Calcula RGB automáticamente si se envía solo HEX."
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Guardar Paleta Seleccionada",
        description="Recibe una lista de colores para guardarlos masivamente asociados a un usuario/captura."
    )
    def bulk_create(self, request):
        """
        Método personalizado para guardar varios colores de un solo golpe.
        Esperamos un array de objetos de color.
        """
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Listar colores",
        parameters=[
            OpenApiParameter(name='captura', description='Filtrar por ID de captura', type=int)
        ]
    )
    def list(self, request, *args, **kwargs):
        # Permitir filtrar: api/colores/?captura=5
        captura_id = request.query_params.get('captura')
        if captura_id:
            self.queryset = self.queryset.filter(captura_id=captura_id)
        return super().list(request, *args, **kwargs)
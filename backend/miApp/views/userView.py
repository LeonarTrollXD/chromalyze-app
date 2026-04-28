from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token 
from django.contrib.auth import authenticate 
from drf_spectacular.utils import extend_schema

from ..models.usuario import Usuario
from ..serializers.userSerializer import UserSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UserSerializer

    @extend_schema(
        summary="Iniciar sesión",
        description="Verifica las credenciales y devuelve el Token de acceso junto con el perfil del usuario."
    )
    @action(detail=False, methods=['post'])
    def login(self, request):
        # 1. Limpieza de datos de entrada
        username_input = request.data.get('username', '').strip()
        password_input = request.data.get('password', '')

        if not username_input or not password_input:
            return Response({'error': 'Faltan datos requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Búsqueda insensible a mayúsculas/minúsculas para el correo
        user_obj = Usuario.objects.filter(correo__iexact=username_input).first()
        
        if user_obj:
            # Autenticamos usando el correo exacto del objeto encontrado
            user = authenticate(request, username=user_obj.correo, password=password_input)
            
            if user is not None:
                # Obtenemos o creamos el token
                token, _ = Token.objects.get_or_create(user=user)
                
                # Respuesta completa para el frontend
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)

        # 3. Respuesta genérica de error
        return Response(
            {'error': 'Correo o contraseña incorrectos.'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    @extend_schema(
        summary="Registrar un nuevo usuario",
        description="Crea un nuevo usuario y le asigna un token de acceso automáticamente."
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        # El serializer ya verifica si el correo es único gracias al validate_correo que agregamos
        if serializer.is_valid():
            user = serializer.save()
            
            # Garantizamos que el token exista
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Usuario registrado con éxito'
            }, status=status.HTTP_201_CREATED)
        
        # Si el correo ya existe, serializer.errors contendrá el mensaje que pusimos: 
        # "Este correo ya está registrado. Intenta iniciar sesión."
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from ..models.captura import Captura
from ..models.color import Color
from ..models.paleta import Paleta, ComposicionPaleta
from ..serializers.capturaSerializer import CapturaSerializer
from PIL import Image
import io
from collections import Counter
from django.db import transaction

class CapturaViewSet(viewsets.ModelViewSet):
    queryset = Captura.objects.all()
    serializer_class = CapturaSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def extraer_colores_predominantes(self, imagen_field):
        try:
            if hasattr(imagen_field, 'read'):
                imagen_field.seek(0)
                img_bytes = imagen_field.read()
                img = Image.open(io.BytesIO(img_bytes))
            else:
                img = Image.open(imagen_field)

            img = img.convert('RGB')
            img.thumbnail((150, 150))
            
            img_temp = img.quantize(colors=16, method=Image.FASTOCTREE).convert('RGB')
            pixeles = list(img_temp.getdata())
            conteo = Counter(pixeles)
            
            mas_comunes_raw = conteo.most_common(5)
            total_pixeles_top5 = sum(cantidad for _, cantidad in mas_comunes_raw)

            resultados_finales = []
            for (r, g, b), cantidad in mas_comunes_raw:
                hex_code = ('#%02x%02x%02x' % (r, g, b)).upper()
                porcentaje = int(round((cantidad / total_pixeles_top5) * 100))
                resultados_finales.append({
                    "hex": hex_code,
                    "rgb": f"{r}, {g}, {b}",
                    "percent": max(1, porcentaje)
                })

            suma_actual = sum(c['percent'] for c in resultados_finales)
            if resultados_finales and suma_actual != 100:
                resultados_finales[0]['percent'] += (100 - suma_actual)

            return resultados_finales
        except Exception as e:
            print(f"❌ Error en Pillow: {e}")
            return None

    def alimentar_biblioteca_maestra(self, colores_data):
        objetos_colores = []
        for data in colores_data:
            color_obj, _ = Color.objects.get_or_create(
                hex_code=data['hex'],
                defaults={
                    'nombre': f"Color {data['hex']}",
                    'rgb_code': data['rgb']
                }
            )
            objetos_colores.append(color_obj)
        return objetos_colores

    @action(detail=False, methods=['post'], url_path='analizar-rapido')
    def analizar_rapido(self, request):
        imagen_archivo = request.FILES.get('imagen')
        if not imagen_archivo:
            return Response({"error": "No se envió ninguna imagen"}, status=400)

        colores_extraidos = self.extraer_colores_predominantes(imagen_archivo)
        if not colores_extraidos:
            return Response({"error": "Error al procesar imagen"}, status=422)

        self.alimentar_biblioteca_maestra(colores_extraidos)

        return Response({
            "mensaje": "Análisis completado",
            "colores_hex": colores_extraidos 
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        GUARDADO DEFINITIVO con validación de nombre único por usuario.
        """
        data = request.data.copy()
        nombre = data.get('nombre', '').strip()
        usuario_id = data.get('usuario')

        # --- VALIDACIÓN DE NOMBRE DUPLICADO ---
        if nombre and usuario_id:
            existe = Captura.objects.filter(nombre__iexact=nombre, usuario_id=usuario_id).exists()
            if existe:
                return Response(
                    {"error": "Ya tienes un proyecto con este nombre."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        if 'colores_predominantes' in data:
            data.pop('colores_predominantes')

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                captura = serializer.save()
                colores_extraidos = self.extraer_colores_predominantes(captura.imagen)
                
                if not colores_extraidos:
                    return Response({"error": "No se pudo analizar la imagen guardada"}, status=422)

                captura.colores_hex = colores_extraidos
                captura.save()
                
                paleta = Paleta.objects.create(
                    nombre=f"Paleta de {captura.nombre}",
                    origen='CAMARA',
                    captura=captura,
                    usuario=captura.usuario
                )

                for data_color in colores_extraidos:
                    color_obj, _ = Color.objects.get_or_create(
                        hex_code=data_color['hex'],
                        defaults={'nombre': f"Color {data_color['hex']}", 'rgb_code': data_color['rgb']}
                    )
                    ComposicionPaleta.objects.create(
                        paleta=paleta,
                        color=color_obj,
                        porcentaje=data_color['percent']
                    )

                return Response(CapturaSerializer(captura).data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print(f"❌ Error en el servidor al crear: {e}")
            return Response({"error": str(e)}, status=500)
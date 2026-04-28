from django.contrib import admin
from django.utils.html import format_html, mark_safe
from .models.usuario import Usuario
from .models.rol import Rol
from .models.captura import Captura
from .models.paleta import Paleta
from .models.color import Color

# --- HELPER UNIVERSAL DE DISEÑO ---
def renderizar_bloques_color(lista_colores, mostrar_porcentaje=True):
    if not lista_colores or not isinstance(lista_colores, list):
        return mark_safe('<span style="color: #999; font-style: italic;">Sin datos</span>')
    
    html_blocks = []
    for c in lista_colores:
        hex_val = str(c.get('hex', '#000000')).upper()
        rgb_val = c.get('rgb', 'N/A')
        percent = c.get('percent', c.get('porcentaje', 0))
        
        badge_percent = format_html('<div style="color: #28a745; font-weight: bold; font-size: 11px; margin-top: 2px;">{}%</div>', percent) if mostrar_porcentaje else ''
        
        block = format_html(
            '<div style="display: inline-block; text-align: center; margin-right: 10px; padding: 8px; border: 1px solid #ccc; border-radius: 10px; background: #fdfdfd; min-width: 85px; box-shadow: 2px 2px 5px rgba(0,0,0,0.08);">'
            '<div style="width: 32px; height: 32px; background-color: {}; border-radius: 6px; margin: 0 auto 6px auto; border: 1px solid #999;"></div>'
            '<div style="line-height: 1.2;">'
            '<span style="color: #000; font-weight: 900; font-family: monospace; font-size: 12px; display: block;">{}</span>'
            '<span style="color: #555; font-size: 10px; font-weight: 600; display: block;">RGB: {}</span>'
            '{}'
            '</div>'
            '</div>',
            hex_val, hex_val, rgb_val, badge_percent
        )
        html_blocks.append(block)
    
    return mark_safe('<div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 5px 0;">' + "".join(html_blocks) + '</div>')

# --- CONFIGURACIÓN DE INLINES ---
class ColorInline(admin.TabularInline):
    model = Paleta.colores.through
    extra = 0
    verbose_name = "Color Compositivo"
    verbose_name_plural = "Composición de la Paleta (Dominancia)"

# --- REGISTROS PROFESIONALES ---

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id', 'etiqueta_nombre', 'descripcion')
    
    def etiqueta_nombre(self, obj):
        nombre_rol = getattr(obj, 'nombre', "Sin nombre")
        colores = {'ADMIN': '#d63031', 'BASICO': '#636e72', 'PREMIUM': '#f1c40f'}
        bg = colores.get(nombre_rol.upper(), '#636e72')
        color_texto = '#000' if nombre_rol.upper() == 'PREMIUM' else '#fff'
        return format_html('<span style="background: {}; color: {}; padding: 4px 12px; border-radius: 50px; font-weight: bold; font-size: 10px; text-transform: uppercase;">{}</span>', bg, color_texto, nombre_rol)
    etiqueta_nombre.short_description = "Rol"

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_estilizado', 'correo_link', 'rol_badge', 'fecha_registro')
    list_filter = ('rol', 'fecha_registro')
    search_fields = ('nombre', 'correo')

    def nombre_estilizado(self, obj):
        nombre = getattr(obj, 'nombre', "Usuario")
        # CORRECCIÓN: Ahora usa el mismo color azul (#3498db) que el correo
        return format_html('<strong style="color: #3498db; font-size: 14px; font-weight: bold;">{}</strong>', nombre)
    
    def correo_link(self, obj):
        correo = getattr(obj, 'correo', "Sin correo")
        return format_html('<a href="mailto:{}" style="color: #3498db; font-weight: 500; text-decoration: none;">{}</a>', correo, correo)

    def rol_badge(self, obj):
        rol_obj = getattr(obj, 'rol', None)
        if not rol_obj: return "-"
        nombre_rol = str(rol_obj.nombre).upper()
        color_map = {'ADMIN': '#d63031', 'BASICO': '#636e72', 'PREMIUM': '#f1c40f'}
        bg_color = color_map.get(nombre_rol, '#444')
        color_texto = '#000' if nombre_rol == 'PREMIUM' else '#fff'
        return format_html('<span style="background: {}; color: {}; padding: 5px 12px; border-radius: 6px; font-size: 10px; font-weight: 800;">{}</span>', bg_color, color_texto, nombre_rol)

@admin.register(Captura)
class CapturaAdmin(admin.ModelAdmin):
    list_display = ('id', 'miniatura', 'nombre', 'usuario', 'datos_tecnicos', 'fecha_captura')
    readonly_fields = ('miniatura', 'datos_tecnicos', 'fecha_captura')

    def miniatura(self, obj):
        if obj.imagen:
            return format_html('<img src="{}" style="width: 70px; height: 70px; border-radius: 10px; border: 2px solid #eee;" />', obj.imagen.url)
        return "Sin Imagen"

    def datos_tecnicos(self, obj):
        colores = getattr(obj, 'colores_hex', [])
        return renderizar_bloques_color(colores)

@admin.register(Paleta)
class PaletaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'origen_label', 'vista_previa_completa', 'fecha_creacion')
    inlines = [ColorInline]
    exclude = ('colores',)

    def origen_label(self, obj):
        iconos = {'CAMARA': '📷', 'MANUAL': '🎨', 'EDICION': '✏️'}
        return format_html('{} <small>{}</small>', iconos.get(obj.origen, '❓'), obj.get_origen_display())

    def vista_previa_completa(self, obj):
        colores_con_data = []
        if hasattr(obj, 'composicionpaleta_set'):
            for composicion in obj.composicionpaleta_set.all():
                colores_con_data.append({
                    'hex': composicion.color.hex_code,
                    'rgb': composicion.color.rgb_code,
                    'porcentaje': composicion.porcentaje
                })
        return renderizar_bloques_color(colores_con_data)

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('id', 'muestra', 'nombre', 'hex_info', 'rgb_info', 'creado_en')
    
    def muestra(self, obj):
        return format_html('<div style="width: 35px; height: 35px; background-color: {}; border-radius: 50%; border: 2px solid #555;"></div>', obj.hex_code)

    def hex_info(self, obj):
        return format_html('<code style="font-weight: bold; color: #e84393;">{}</code>', obj.hex_code.upper())

    def rgb_info(self, obj):
        # CORRECCIÓN: Números blancos sobre fondo oscuro para que se vean bien
        return format_html(
            '<span style="font-family: monospace; font-weight: bold; background: #34495e; color: #ffffff; padding: 4px 10px; border-radius: 5px; border: 1px solid #2c3e50;">{}</span>', 
            obj.rgb_code
        )
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

class Color(models.Model):
    # EL CORAZÓN DE LA BIBLIOTECA: hex_code es único. 
    # No habrá dos registros con el mismo código HEX.
    hex_code = models.CharField(
        max_length=7, 
        unique=True, 
        help_text="Ej: #FF5733"
    ) 
    
    nombre = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Nombre descriptivo (ej: Azul Cobalto)"
    ) 
    
    # Valores técnicos para búsquedas avanzadas o filtros
    r = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(255)])
    g = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(255)])
    b = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(255)])
    
    rgb_code = models.CharField(max_length=20, blank=True, null=True) 
    
    creado_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """
        Lógica de normalización: asegura que el HEX siempre sea estándar
        y calcula el RGB automáticamente antes de guardar.
        """
        if self.hex_code:
            # Asegurar formato #FFFFFF
            if not self.hex_code.startswith('#'):
                self.hex_code = f"#{self.hex_code}"
            self.hex_code = self.hex_code.upper()
            
            # Convertir a RGB para la base de datos
            hex_val = self.hex_code.lstrip('#')
            if len(hex_val) == 6:
                try:
                    self.r = int(hex_val[0:2], 16)
                    self.g = int(hex_val[2:4], 16)
                    self.b = int(hex_val[4:6], 16)
                    self.rgb_code = f"{self.r},{self.g},{self.b}"
                except ValueError:
                    pass 
            
            # Autogenerar nombre si está vacío
            if not self.nombre:
                self.nombre = f"Color {self.hex_code}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.hex_code})"

    class Meta:
        verbose_name = "Color"
        verbose_name_plural = "Biblioteca Maestra de Colores"
        # Ordenamos por los más recientes agregados a la biblioteca
        ordering = ['-creado_en']
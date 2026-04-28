from django.db import models

class Paleta(models.Model):
    ORIGEN_CHOICES = [
        ('CAMARA', 'Captura de Cámara'),
        ('MANUAL', 'Creación/Combinación Manual'),
        ('EDICION', 'Edición de Existente'),
    ]

    nombre = models.CharField(max_length=100, default="Mi Combinación")
    
    origen = models.CharField(
        max_length=10,
        choices=ORIGEN_CHOICES,
        default='MANUAL',
        help_text="Indica si la paleta nació de una foto o del combinador manual"
    )

    # Si borras la captura, la paleta desaparece (Limpieza automática)
    captura = models.ForeignKey(
        'miApp.Captura', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='paletas_generadas'
    )

    # RELACIÓN MAESTRA: Usamos 'through' para guardar el porcentaje sin ensuciar el modelo Color
    colores = models.ManyToManyField(
        'miApp.Color', 
        through='ComposicionPaleta',
        related_name='paletas_contenidas',
        blank=True
    )
    
    usuario = models.ForeignKey(
        'miApp.Usuario', 
        on_delete=models.CASCADE,
        related_name='paletas'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_display = self.usuario.nombre if self.usuario else "Anonimo"
        return f"{self.nombre} [{self.get_origen_display()}] - {user_display}"

    class Meta:
        verbose_name = "Paleta"
        verbose_name_plural = "Paletas"
        ordering = ['-fecha_creacion']


# --- NUEVA TABLA INTERMEDIA ---
class ComposicionPaleta(models.Model):
    """
    Esta tabla es la que une la Paleta con el Color.
    Aquí es donde vive el porcentaje de dominancia.
    """
    paleta = models.ForeignKey('Paleta', on_delete=models.CASCADE)
    color = models.ForeignKey('miApp.Color', on_delete=models.CASCADE)
    
    # Aquí vive la dominancia: específica para CADA paleta
    porcentaje = models.IntegerField(
        default=0,
        help_text="Qué tanto brilla este color en esta paleta específicamente"
    )

    class Meta:
        verbose_name = "Composición de Paleta"
        verbose_name_plural = "Composiciones de Paletas"
        # Ordenamos para que en la paleta el color más dominante salga primero
        ordering = ['-porcentaje']
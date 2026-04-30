from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver

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

    # Si borras la captura, la paleta desaparece automáticamente por CASCADE
    captura = models.ForeignKey(
        'miApp.Captura', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='paletas_generadas'
    )

    # RELACIÓN MAESTRA
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


# --- TABLA INTERMEDIA ---
class ComposicionPaleta(models.Model):
    paleta = models.ForeignKey('Paleta', on_delete=models.CASCADE)
    color = models.ForeignKey('miApp.Color', on_delete=models.CASCADE)
    porcentaje = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Composición de Paleta"
        verbose_name_plural = "Composiciones de Paletas"
        ordering = ['-porcentaje']


# --- SIGNALS: EL ÚNICO ENCARGADO DE LA LIMPIEZA ---

@receiver(post_delete, sender=Paleta)
def eliminar_captura_al_borrar_paleta(sender, instance, **kwargs):
    """
    Se dispara tras borrar una Paleta. Si es de cámara, borra la captura.
    El bloque try/except evita el error 'DoesNotExist' si el CASCADE ya actuó.
    """
    if instance.origen == 'CAMARA' and instance.captura_id:
        try:
            # Import local para evitar importaciones circulares
            from ..models.captura import Captura
            captura = Captura.objects.get(id=instance.captura_id)
            captura.delete()
        except Exception:
            # Si la captura ya no existe, no hacemos nada (evita el error 500)
            pass
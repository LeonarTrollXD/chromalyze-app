from django.db import models
from django.db.models import UniqueConstraint
from django.core.exceptions import ValidationError

class Captura(models.Model):
    nombre = models.CharField(max_length=100, null=True, blank=True)
    imagen = models.ImageField(upload_to='capturas/', null=True, blank=True)
    colores_hex = models.JSONField(default=list, blank=True) 
    
    usuario = models.ForeignKey(
        'miApp.Usuario', 
        on_delete=models.CASCADE,
        related_name='capturas',
        null=True, 
        blank=True
    )
    
    fecha_captura = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Lógica de límite para Plan Básico
        if self.usuario and not self.pk: # Solo validar al crear (no al editar)
            # Suponiendo que tienes un campo 'es_premium' en tu modelo Usuario
            # Si no lo tienes, puedes limitarlos a todos por igual por ahora
            conteo = Captura.objects.filter(usuario=self.usuario).count()
            if conteo >= 3:
                raise ValidationError(
                    "Has alcanzado el límite de 3 capturas del plan básico. "
                    "Hazte Premium para guardar proyectos ilimitados."
                )

    def save(self, *args, **kwargs):
        self.full_clean() # Fuerza a ejecutar el método clean antes de guardar
        super().save(*args, **kwargs)

    def __str__(self):
        user_name = self.usuario.nombre if self.usuario else "Escaneo Rápido"
        return f"{self.nombre or 'Sin nombre'} (ID: {self.id}) - {user_name}"
    
    class Meta:
        verbose_name = "Captura"
        verbose_name_plural = "Capturas"
        ordering = ['-fecha_captura']
        constraints = [
            UniqueConstraint(
                fields=['nombre', 'usuario'], 
                name='unique_nombre_captura_por_usuario',
                condition=models.Q(usuario__isnull=False)
            )
        ]
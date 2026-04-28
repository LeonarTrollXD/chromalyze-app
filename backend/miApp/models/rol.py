from django.db import models

class Rol(models.Model):
    # 'unique=True' es vital para que las validaciones de negocio sean consistentes
    nombre = models.CharField(max_length=50, unique=True) # Ej: ADMIN, PRO, USER
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        # Ordenamos alfabéticamente para que en los formularios de Django se vea bien
        ordering = ['nombre']
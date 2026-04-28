from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from .rol import Rol

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El usuario debe tener un correo electrónico')
        
        correo = self.normalize_email(correo)
        
        # --- LÓGICA DE ROL POR DEFECTO ---
        # Si no viene un rol en los datos, buscamos el rol "BASICO"
        if extra_fields.get('rol') is None:
            # Buscamos por nombre (asegúrate que en tu DB se llame exacto "BASICO" o "Básico")
            rol_defecto = Rol.objects.filter(nombre__iexact="BASICO").first()
            
            # Si por alguna razón no existe el rol en la DB, tomamos el primero que haya
            if not rol_defecto:
                rol_defecto = Rol.objects.first()
            
            extra_fields['rol'] = rol_defecto

        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Para el superusuario intentamos asignar "ADMIN"
        if extra_fields.get('rol') is None:
            rol_admin = Rol.objects.filter(nombre__iexact="ADMIN").first() or Rol.objects.first()
            extra_fields['rol'] = rol_admin

        return self.create_user(correo, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True) # Esto ya evita duplicados a nivel DB
    
    rol = models.ForeignKey(
        Rol, 
        on_delete=models.PROTECT,
        related_name='usuarios',
        null=True, 
        blank=True
    )
    
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo' 
    REQUIRED_FIELDS = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.correo})"

    # --- MÉTODOS DE PERMISOS ---
    @property
    def es_admin(self):
        return self.rol and self.rol.nombre.upper() == "ADMIN"

    @property
    def es_premium(self):
        return self.rol and self.rol.nombre.upper() == "PREMIUM"

    @property
    def es_basico(self):
        return self.rol and self.rol.nombre.upper() == "BASICO"

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
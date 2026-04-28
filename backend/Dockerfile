# Imagen base exacta Python 3.14.3
FROM python:3.14.3-slim

# Evitar que Python genere archivos .pyc y activar logs inmediatos
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Crear directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para Django + PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del proyecto
COPY . .

# Exponer el puerto donde correrá Django
EXPOSE 8000

# Comando por defecto (modo desarrollo)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
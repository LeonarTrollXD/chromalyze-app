# Usa una versión estable como la 20
FROM node:20-slim

WORKDIR /app

# Instalamos dependencias básicas
RUN apt-get update && apt-get install -y \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiamos archivos de dependencias
COPY package.json package-lock.json* ./

# Instalamos dependencias (usamos --legacy-peer-deps por si hay conflictos de versiones en Expo)
RUN npm install --legacy-peer-deps

COPY . .

# Puertos estándar de Expo/Metro
EXPOSE 8081 19000 19001 19002

# Comando para iniciar
CMD ["npx", "expo", "start"]
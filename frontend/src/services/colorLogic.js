/**
 * Lógica avanzada de procesamiento de color para GALACTICO Project
 */

// 1. Calcula la distancia visual entre dos colores (Fórmula de Distancia Euclidiana)
const getDistance = (rgb1, rgb2) => {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

// 2. Convierte HEX a RGB objeto
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * FUNCIÓN PRINCIPAL: Agrupar colores similares y calcular porcentajes reales
 * @param {Array} rawColors - Lista de colores detectados por el sensor [{hex, count}, ...]
 */
export const processColorAnalysis = (rawColors) => {
  if (!rawColors || rawColors.length === 0) return [];

  const threshold = 45; // Umbral de diferencia. Si es menor a 45, se consideran "el mismo color"
  let groups = [];

  // Paso 1: Agrupación (Clustering)
  rawColors.forEach(item => {
    const rgb = hexToRgb(item.hex);
    let foundGroup = false;

    for (let group of groups) {
      const groupRgb = hexToRgb(group.hex);
      if (getDistance(rgb, groupRgb) < threshold) {
        group.count += item.count; // Sumamos la cantidad al grupo existente
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push({ ...item, rgb }); // Creamos un nuevo grupo cromático
    }
  });

  // Paso 2: Ordenar de mayor a menor presencia
  groups.sort((a, b) => b.count - a.count);

  // Paso 3: Normalización a 100% (Sentido común visual)
  const totalPixels = groups.reduce((acc, g) => acc + g.count, 0);
  
  const finalPalette = groups.slice(0, 5).map(group => {
    const rawPercent = (group.count / totalPixels) * 100;
    return {
      hex: group.hex,
      // Si el color existe, le damos mínimo un 1% para que no salga 0%
      percent: Math.max(1, Math.round(rawPercent))
    };
  });

  // Ajuste final para que la suma sea exactamente 100
  const currentSum = finalPalette.reduce((acc, p) => acc + p.percent, 0);
  if (currentSum !== 100 && finalPalette.length > 0) {
    finalPalette[0].percent += (100 - currentSum);
  }

  return finalPalette;
};

// --- Mantenemos tus funciones de recomendaciones pero mejoradas ---

export const getRecommendations = (selectedColors) => {
  const maxColors = 4;
  if (selectedColors.length === 0) return [];
  
  const baseColor = selectedColors[0].hex;
  const hsl = hexToHsl(baseColor);
  const recommendations = [];

  // Generar análogos con saltos más naturales
  for (let i = 1; i <= (maxColors - selectedColors.length); i++) {
    const newHue = (hsl.h + (i * 35)) % 360; 
    recommendations.push(hslToHex(newHue, hsl.s, hsl.l));
  }

  return recommendations;
};

// (Funciones auxiliares hexToHsl y hslToHex se mantienen igual debajo...)
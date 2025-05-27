/**
 * Genera una clave de seguridad numérica aleatoria
 * @param length Longitud de la clave a generar
 * @returns Clave de seguridad numérica
 */
export const generateSecurityKey = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

/**
 * Formatea una clave de seguridad para facilitar su lectura
 * @param key Clave de seguridad a formatear
 * @returns Clave formateada con espacios cada 4 dígitos
 */
export const formatSecurityKey = (key: string): string => {
  if (!key) return '';
  
  // Agregar un espacio cada 4 dígitos para facilitar la lectura
  return key.match(/.{1,4}/g)?.join(' ') || key;
};

/**
 * Valida si una cadena contiene solo dígitos
 * @param input Cadena a validar
 * @returns true si la cadena contiene solo dígitos
 */
export const isNumericString = (input: string): boolean => {
  return /^\d+$/.test(input);
};

/**
 * Limpia una clave de seguridad eliminando espacios y caracteres no numéricos
 * @param key Clave de seguridad a limpiar
 * @returns Clave limpia con solo dígitos
 */
export const cleanSecurityKey = (key: string): string => {
  if (!key) return '';
  
  // Eliminar todos los caracteres no numéricos
  return key.replace(/\D/g, '');
};

/**
 * Obtiene información del dispositivo para identificación
 * @returns Objeto con información del dispositivo
 */
export const getDeviceInfo = async (): Promise<any> => {
  try {
    // Importar dinámicamente para evitar problemas con SSR
    const Device = await import('expo-device');
    
    return {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      modelId: Device.modelId,
      designName: Device.designName,
      productName: Device.productName,
      deviceYearClass: Device.deviceYearClass,
      totalMemory: Device.totalMemory,
      osName: Device.osName,
      osVersion: Device.osVersion,
      osBuildId: Device.osBuildId,
      osInternalBuildId: Device.osInternalBuildId,
      osBuildFingerprint: Device.osBuildFingerprint,
      platformApiLevel: Device.platformApiLevel,
      deviceName: Device.deviceName,
    };
  } catch (error) {
    console.error('Error al obtener información del dispositivo:', error);
    return {
      error: 'No se pudo obtener información del dispositivo'
    };
  }
};

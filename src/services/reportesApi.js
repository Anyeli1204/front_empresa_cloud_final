const REPORTES_API_BASE_URL = 'https://twc2hcjsii.execute-api.us-east-1.amazonaws.com/dev/empleados/recursos';

export const obtenerVentasPorSegmentos = async () => {
  try {
    const response = await fetch(`${REPORTES_API_BASE_URL}/ventas_por_segmentos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener ventas por segmentos: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerVentasPorSegmentos:', error);
    throw error;
  }
};

export const obtenerVentasPorEstado = async () => {
  try {
    const response = await fetch(`${REPORTES_API_BASE_URL}/Ventas_por_Estado`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener ventas por estado: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerVentasPorEstado:', error);
    throw error;
  }
};

export const obtenerVentasPorCombinacion = async () => {
  try {
    const response = await fetch(`${REPORTES_API_BASE_URL}/Ventas_por_Combinacion`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener ventas por combinación: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerVentasPorCombinacion:', error);
    throw error;
  }
};

export const obtenerMargenesPorGanancia = async () => {
  try {
    const response = await fetch(`${REPORTES_API_BASE_URL}/margenes_por_ganancia`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener márgenes por ganancia: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerMargenesPorGanancia:', error);
    throw error;
  }
};


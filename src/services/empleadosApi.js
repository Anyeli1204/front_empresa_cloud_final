const EMPLEADOS_API_BASE_URL = 'https://twc2hcjsii.execute-api.us-east-1.amazonaws.com/dev/empleados';

export const registrarEmpleado = async (datosEmpleado) => {
  try {
    const response = await fetch(`${EMPLEADOS_API_BASE_URL}/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosEmpleado)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al registrar empleado: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en registrarEmpleado:', error);
    throw error;
  }
};

export const loginEmpleado = async (tenant_id, password, rol) => {
  try {
    const response = await fetch(`${EMPLEADOS_API_BASE_URL}/logearse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id,
        password,
        rol
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al iniciar sesión: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en loginEmpleado:', error);
    throw error;
  }
};

export const obtenerPerfilEmpleado = async (tenant_id) => {
  try {
    const url = `${EMPLEADOS_API_BASE_URL}/perfil`;
    const body = JSON.stringify({ tenant_id });
    
    console.log('obtenerPerfilEmpleado - URL:', url);
    console.log('obtenerPerfilEmpleado - Body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });
    
    console.log('obtenerPerfilEmpleado - Response status:', response.status);
    console.log('obtenerPerfilEmpleado - Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('obtenerPerfilEmpleado - Error response text:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || `Error al obtener perfil: ${response.statusText}` };
      }
      
      throw new Error(errorData.message || `Error al obtener perfil: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('obtenerPerfilEmpleado - Data recibida:', data);
    return data;
  } catch (error) {
    console.error('Error en obtenerPerfilEmpleado:', error);
    console.error('Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

export const actualizarPerfilEmpleado = async (tenant_id, datosActualizacion) => {
  try {
    const response = await fetch(`${EMPLEADOS_API_BASE_URL}/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id,
        ...datosActualizacion
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al actualizar perfil: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en actualizarPerfilEmpleado:', error);
    throw error;
  }
};


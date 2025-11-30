/**
 * Utilidades para manejar la sesión del usuario
 */

const TENANT_ID_KEY = 'tenant_id';
const ID_EMPLEADO_KEY = 'id_empleado';
const ROL_EMPLEADO_KEY = 'rol_empleado';
const NOMBRE_EMPLEADO_KEY = 'nombre_empleado';
const TOKEN_KEY = 'token';

/**
 * Guarda la información de sesión del usuario
 * @param {object} datosUsuario - Datos del usuario
 */
export const guardarSesion = (datosUsuario) => {
  if (datosUsuario.tenant_id) {
    localStorage.setItem(TENANT_ID_KEY, datosUsuario.tenant_id);
  }
  if (datosUsuario.id_empleado) {
    localStorage.setItem(ID_EMPLEADO_KEY, datosUsuario.id_empleado);
  }
  if (datosUsuario.rol_empleado) {
    localStorage.setItem(ROL_EMPLEADO_KEY, datosUsuario.rol_empleado);
  }
  if (datosUsuario.nombre_empleado) {
    localStorage.setItem(NOMBRE_EMPLEADO_KEY, datosUsuario.nombre_empleado);
  }
  if (datosUsuario.token) {
    localStorage.setItem(TOKEN_KEY, datosUsuario.token);
  }
};

/**
 * Obtiene el tenant_id de la sesión
 * @returns {string} tenant_id (email del empleado)
 */
export const obtenerTenantId = () => {
  return localStorage.getItem(TENANT_ID_KEY) || '';
};

/**
 * Obtiene el id_empleado de la sesión
 * @returns {string} id_empleado
 */
export const obtenerIdEmpleado = () => {
  return localStorage.getItem(ID_EMPLEADO_KEY) || '';
};

/**
 * Obtiene el rol del empleado de la sesión
 * @returns {string} rol_empleado
 */
export const obtenerRolEmpleado = () => {
  return localStorage.getItem(ROL_EMPLEADO_KEY) || '';
};

/**
 * Obtiene el nombre del empleado de la sesión
 * @returns {string} nombre_empleado
 */
export const obtenerNombreEmpleado = () => {
  return localStorage.getItem(NOMBRE_EMPLEADO_KEY) || '';
};

/**
 * Obtiene todos los datos de sesión
 * @returns {object} Datos de sesión
 */
export const obtenerSesion = () => {
  return {
    tenant_id: obtenerTenantId(),
    id_empleado: obtenerIdEmpleado(),
    rol_empleado: obtenerRolEmpleado(),
    nombre_empleado: obtenerNombreEmpleado()
  };
};

/**
 * Obtiene el token de autenticación
 * @returns {string} token
 */
export const obtenerToken = () => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

/**
 * Limpia la sesión del usuario
 */
export const cerrarSesion = () => {
  localStorage.removeItem(TENANT_ID_KEY);
  localStorage.removeItem(ID_EMPLEADO_KEY);
  localStorage.removeItem(ROL_EMPLEADO_KEY);
  localStorage.removeItem(NOMBRE_EMPLEADO_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Verifica si hay una sesión activa
 * @returns {boolean} true si hay sesión activa
 */
export const haySesionActiva = () => {
  return !!obtenerIdEmpleado();
};



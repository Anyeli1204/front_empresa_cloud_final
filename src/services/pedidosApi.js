const API_BASE_URL = 'https://z1ya867rbl.execute-api.us-east-1.amazonaws.com';
const PEDIDOS_DETAIL_API_URL = 'https://b98ebfm5yc.execute-api.us-east-1.amazonaws.com';
const PEDIDOS_API_URL = 'https://gf4636pibh.execute-api.us-east-1.amazonaws.com';
const WORKFLOW_API_URL = 'https://0cd0yz5ys4.execute-api.us-east-1.amazonaws.com';

const getTenantId = () => {
  return localStorage.getItem('tenant_id_pedidos') || 'tenant2';
};

const getIdEmpleado = () => {
  return localStorage.getItem('id_empleado') || '';
};

export const listarPedidosPorEstados = async (estados = [], tenantId = null, uuid = null) => {
  try {
    let url = `${API_BASE_URL}/pedidos`;
    const params = [];
    
    if (tenantId) {
      params.push(`tenant_id=${encodeURIComponent(tenantId)}`);
    }
    
    if (uuid) {
      params.push(`uuid=${encodeURIComponent(uuid)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    console.log('listarPedidosPorEstados - URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('listarPedidosPorEstados - Response status:', response.status);
    console.log('listarPedidosPorEstados - Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('listarPedidosPorEstados - Error response:', errorText);
      throw new Error(`Error al obtener pedidos: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('listarPedidosPorEstados - Data recibida:', data);
    
    if (estados && estados.length > 0) {
      const estadosArray = Array.isArray(estados) ? estados : [estados];
      const estadosNormalizados = estadosArray.map(e => e.toUpperCase());
      
      const pedidosFiltrados = (data.pedidos || []).filter(pedido => {
        const estadoPedido = pedido.estado_pedido?.toUpperCase();
        return estadosNormalizados.includes(estadoPedido);
      });
      
      return {
        cantidad: pedidosFiltrados.length,
        pedidos: pedidosFiltrados
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error en listarPedidosPorEstados:', error);
    console.error('Error completo:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet o contacta al administrador.');
    }
    
    throw error;
  }
};

export const obtenerPedidoPorId = async (uuid, tenantId = null) => {
  try {
    const tenantIdFinal = tenantId || getTenantId();
    
    const url = `${PEDIDOS_DETAIL_API_URL}/pedidos/id?tenant_id=${tenantIdFinal}&uuid=${uuid}`;
    
    console.log('Obteniendo pedido:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pedido no encontrado');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener pedido: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerPedidoPorId:', error);
    
    try {
      const url = `${API_BASE_URL}/pedidos`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const pedido = (data.pedidos || []).find(p => 
          p.uuid === uuid || 
          p.id === uuid || 
          p.id_pedido === uuid
        );
        
        if (pedido) {
          console.log('Pedido encontrado en lista de pedidos');
          return pedido;
        }
      }
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
    
    throw error;
  }
};

export const confirmarPaso = async (uuid, paso, datosAdicionales = {}) => {
  try {
    const tenantId = datosAdicionales.tenant_id || getTenantId();
    const idEmpleado = getIdEmpleado();
    
    const body = {
      tenant_id: tenantId,
      uuid: uuid,
      paso: paso
    };
    
    if (paso === 'cocina-lista' || paso === 'empaquetamiento-listo') {
      body.id_empleado = datosAdicionales.id_empleado || idEmpleado;
    } else if (paso === 'delivery-entregado') {
      body.repartidor = datosAdicionales.repartidor || '';
      body.id_repartidor = datosAdicionales.id_repartidor || '';
      body.origen = datosAdicionales.origen || '';
      body.destino = datosAdicionales.destino || '';
    }
    
    console.log('Confirmar paso - Body:', body);
    
    const response = await fetch(`${WORKFLOW_API_URL}/workflow/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al confirmar paso: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en confirmarPaso:', error);
    throw error;
  }
};

export const mapearEstadoFrontend = (estadoBackend) => {
  if (!estadoBackend) return 'Desconocido';
  
  const estadoNormalizado = estadoBackend.toUpperCase();
  
  const mapeo = {
    'PAGADO': 'Pagado',
    'COCINA': 'En preparación',
    'EMPAQUETAMIENTO': 'Listo para retirar',
    'DELIVERY': 'En camino',
    'ENTREGADO': 'Entregado',
    'cocina': 'En preparación',
    'empaquetamiento': 'Listo para retirar',
    'delivery': 'En camino',
    'entregado': 'Entregado'
  };
  
  return mapeo[estadoNormalizado] || mapeo[estadoBackend] || estadoBackend;
};

export const mapearEstadoBackend = (estadoFrontend) => {
  const mapeo = {
    'Pagado': 'PAGADO',
    'En preparación': 'COCINA',
    'Listo para retirar': 'EMPAQUETAMIENTO',
    'En camino': 'DELIVERY',
    'Entregado': 'ENTREGADO'
  };
  
  return mapeo[estadoFrontend] || estadoFrontend?.toUpperCase() || estadoFrontend;
};

export const obtenerSiguientePaso = (estadoActual) => {
  if (!estadoActual) return null;
  
  const estadoNormalizado = estadoActual.toUpperCase();
  
  const flujo = {
    'PAGADO': { paso: 'cocina-lista', nombre: 'Listo para retirar' },
    'COCINA': { paso: 'cocina-lista', nombre: 'Listo para retirar' },
    'EMPAQUETAMIENTO': { paso: 'empaquetamiento-listo', nombre: 'En camino' },
    'DELIVERY': { paso: 'delivery-entregado', nombre: 'Entregado' },
    'ENTREGADO': null,
    'cocina': { paso: 'cocina-lista', nombre: 'Listo para retirar' },
    'empaquetamiento': { paso: 'empaquetamiento-listo', nombre: 'En camino' },
    'delivery': { paso: 'delivery-entregado', nombre: 'Entregado' },
    'entregado': null
  };
  
  return flujo[estadoNormalizado] || flujo[estadoActual] || null;
};


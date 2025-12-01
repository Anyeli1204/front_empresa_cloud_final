import { obtenerTenantId, obtenerIdEmpleado } from '../utils/sessionUtils';

const API_BASE_URL = 'https://z1ya867rbl.execute-api.us-east-1.amazonaws.com';
const PEDIDOS_DETAIL_API_URL = 'https://b98ebfm5yc.execute-api.us-east-1.amazonaws.com';
const WORKFLOW_API_URL = 'https://z1ya867rbl.execute-api.us-east-1.amazonaws.com';
const WORKFLOW_INICIAR_API_URL = 'https://z1ya867rbl.execute-api.us-east-1.amazonaws.com';

const getTenantId = () => {
  return obtenerTenantId() || 'restaurante_central_01';
};

const getIdEmpleado = () => {
  return obtenerIdEmpleado() || '';
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
    let tenantIdFinal = tenantId;
    
    if (!tenantIdFinal) {
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
          
          if (pedido && pedido.tenant_id) {
            tenantIdFinal = pedido.tenant_id;
            console.log('Tenant_id obtenido del pedido en lista:', tenantIdFinal);
          }
        }
      } catch (fallbackError) {
        console.error('Error al buscar tenant_id en lista:', fallbackError);
      }
    }
    
    if (!tenantIdFinal) {
      tenantIdFinal = 'restaurante_central_01';
      console.log('Usando tenant_id por defecto:', tenantIdFinal);
    }
    
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
          console.log('Pedido encontrado en lista de pedidos (fallback)');
          return pedido;
        }
      }
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
    
    throw error;
  }
};

let iniciandoWorkflowGlobal = false;

export const iniciarWorkflow = async (tenant_id, uuid, cliente_email, origen, destino) => {
  if (iniciandoWorkflowGlobal) {
    console.log('iniciarWorkflow: Ya hay una ejecución en curso, cancelando...');
    throw new Error('Ya hay un workflow en proceso para este pedido');
  }
  
  try {
    iniciandoWorkflowGlobal = true;
    
    const body = {
      tenant_id,
      uuid,
      cliente_email,
      origen,
      destino
    };
    
    console.log('=== INICIAR WORKFLOW ===');
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('URL:', `${WORKFLOW_INICIAR_API_URL}/workflow/iniciar`);
    
    const response = await fetch(`${WORKFLOW_INICIAR_API_URL}/workflow/iniciar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      iniciandoWorkflowGlobal = false;
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al iniciar workflow: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Workflow iniciado exitosamente:', data);
    
    iniciandoWorkflowGlobal = false;
    return data;
  } catch (error) {
    iniciandoWorkflowGlobal = false;
    console.error('Error en iniciarWorkflow:', error);
    throw error;
  }
};

export const confirmarPaso = async (uuid, paso, datosAdicionales = {}) => {
  try {
    if (!datosAdicionales.tenant_id) {
      throw new Error('tenant_id es requerido. Debe venir del pedido.');
    }
    
    if (!uuid) {
      throw new Error('uuid es requerido. Debe venir del pedido.');
    }
    
    const idEmpleado = datosAdicionales.id_empleado || getIdEmpleado();
    
    if ((paso === 'cocina-lista' || paso === 'empaquetamiento-listo') && !idEmpleado) {
      throw new Error('id_empleado es requerido para este paso. Por favor, inicia sesión nuevamente.');
    }
    
    const body = {
      tenant_id: datosAdicionales.tenant_id,
      uuid: uuid,
      paso: paso
    };
    
    if (paso === 'cocina-lista') {
      body.id_empleado = idEmpleado;
    } else if (paso === 'empaquetamiento-listo') {
      body.id_empleado = idEmpleado;
      body.cliente_email = datosAdicionales.cliente_email || '';
      body.origen = datosAdicionales.origen || 'LIMA - CENTRO, Av. Arequipa 123, Lima';
      body.destino = datosAdicionales.destino || 'MENDRANO SILVA';
    } else if (paso === 'delivery-entregado') {
      body.cliente_email = datosAdicionales.cliente_email || '';
      body.origen = datosAdicionales.origen || 'LIMA - CENTRO, Av. Arequipa 123, Lima';
      body.destino = datosAdicionales.destino || 'MENDRANO SILVA';
      body.repartidor = datosAdicionales.repartidor || 'Repartidor Default';
      body.id_repartidor = datosAdicionales.id_repartidor || 'REP-001';
    }
    
    console.log('=== ENVIANDO A API ===');
    console.log('URL:', `${WORKFLOW_API_URL}/workflow/confirmar`);
    console.log('Body (JSON):', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${WORKFLOW_API_URL}/workflow/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      let errorMessage = `Error al confirmar paso: ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        const errorData = JSON.parse(errorText);
        
        if (errorData.detalle && errorData.detalle.includes('Task Timed Out')) {
          errorMessage = 'El pedido ya fue procesado o el tiempo de espera expiró. Por favor, recarga la página para ver el estado actual.';
        } else {
          errorMessage = errorData.mensaje || errorData.message || errorData.error || errorText || errorMessage;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
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
  
  return estadoNormalizado || estadoBackend;
};

export const mapearEstadoBackend = (estadoFrontend) => {
  if (!estadoFrontend) return null;
  return estadoFrontend.toUpperCase();
};

export const obtenerSiguientePaso = (estadoActual) => {
  if (!estadoActual) return null;
  
  const estadoNormalizado = estadoActual.toUpperCase();
  
  const flujo = {
    'PAGADO': { paso: 'cocina-lista', nombre: 'COCINA' },
    'COCINA': { paso: 'cocina-lista', nombre: 'EMPAQUETAMIENTO' },
    'EMPAQUETAMIENTO': { paso: 'empaquetamiento-listo', nombre: 'DELIVERY' },
    'DELIVERY': { paso: 'delivery-entregado', nombre: 'ENTREGADO' },
    'ENTREGADO': null,
    'pagado': { paso: 'cocina-lista', nombre: 'COCINA' },
    'cocina': { paso: 'cocina-lista', nombre: 'EMPAQUETAMIENTO' },
    'empaquetamiento': { paso: 'empaquetamiento-listo', nombre: 'DELIVERY' },
    'delivery': { paso: 'delivery-entregado', nombre: 'ENTREGADO' },
    'entregado': null
  };
  
  return flujo[estadoNormalizado] || flujo[estadoActual] || null;
};


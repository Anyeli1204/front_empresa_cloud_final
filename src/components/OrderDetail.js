import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import duoBravasoImage from '../assets/duo bravaso.webp';
import duplaNavidenaImage from '../assets/dupla navideña.webp';
import duoQuesoTocinoImage from '../assets/duo queso tocinno.webp';
import personalBravazoImage from '../assets/Personal Bravado.webp';
import { 
  obtenerPedidoPorId, 
  confirmarPaso,
  iniciarWorkflow,
  mapearEstadoFrontend, 
  mapearEstadoBackend,
  obtenerSiguientePaso 
} from '../services/pedidosApi';
import { obtenerRolEmpleado, obtenerIdEmpleado, obtenerTenantId, cerrarSesion } from '../utils/sessionUtils';
import { obtenerPerfilEmpleado } from '../services/empleadosApi';
import './OrderDetail.css';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [iniciandoWorkflow, setIniciandoWorkflow] = useState(false);
  const [popup, setPopup] = useState({ mostrar: false, mensaje: '', tipo: 'success' });

  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let respuesta = await obtenerPedidoPorId(id, null);
        
        const datosPedido = respuesta.pedido || respuesta;
        const datosCocina = respuesta.cocina || null;
        const datosEmpaquetamiento = respuesta.empaquetamiento || null;
        const datosDelivery = respuesta.delivery || null;
        
        const origen = datosDelivery?.origen || null;
        const destino = datosDelivery?.destino || null;
        const repartidor = datosDelivery?.repartidor || null;
        const idRepartidor = datosDelivery?.id_repartidor || null;
        
        let descripcion = '';
        if (datosPedido.elementos && Array.isArray(datosPedido.elementos) && datosPedido.elementos.length > 0) {
          const nombresCombos = [];
          datosPedido.elementos.forEach(elemento => {
            if (elemento.combo && Array.isArray(elemento.combo)) {
              nombresCombos.push(...elemento.combo);
            }
          });
          if (nombresCombos.length > 0) {
            descripcion = nombresCombos.join(', ');
          } else {
            descripcion = `Pedido #${datosPedido.uuid || 'N/A'}`;
          }
        } else if (datosPedido.elementos?.combo && Array.isArray(datosPedido.elementos.combo)) {
          const combos = datosPedido.elementos.combo.map(c => c.nombre || c.descripcion).join(', ');
          descripcion = combos;
        } else {
          descripcion = `Pedido #${datosPedido.uuid || 'N/A'}`;
        }
        
        const uuid = datosPedido.uuid;
        const tenantIdDelPedido = datosPedido.tenant_id || 'restaurante_central_01';
        
        let precioTotal = 0;
        if (datosPedido.elementos && Array.isArray(datosPedido.elementos)) {
          precioTotal = datosPedido.elementos.reduce((sum, elemento) => {
            const precioElemento = elemento.precio || 0;
            const cantidad = elemento.cantidad_combo || 1;
            return sum + (precioElemento * cantidad);
          }, 0);
        } else if (datosPedido.precio) {
          precioTotal = datosPedido.precio;
        }
        
        let puntos = 0;
        if (precioTotal && datosPedido.multiplicador_de_puntos) {
          puntos = Math.round(precioTotal * datosPedido.multiplicador_de_puntos);
        } else if (datosPedido.puntos) {
          puntos = datosPedido.puntos;
        }
        
        const pedidoTransformado = {
          id: uuid || datosPedido.id,
          id_pedido: uuid || datosPedido.id,
          uuid: uuid,
          tenant_id: tenantIdDelPedido,
          image: datosPedido.imagen_combo_url || obtenerImagenAleatoria(),
          name: `Pedido #${uuid ? uuid.substring(0, 8) : 'N/A'}`,
          description: descripcion,
          status: mapearEstadoFrontend(datosPedido.estado_pedido),
          estado_backend: datosPedido.estado_pedido,
          time: calcularTiempoEstimado(datosPedido.estado_pedido),
          type: datosPedido.delivery ? 'Delivery' : 'Retiro en local',
          date: formatearFecha(datosPedido.fecha_pedido || datosPedido.fecha_creacion),
          origen: origen || datosDelivery?.origen || null,
          destino: destino || datosDelivery?.destino || null,
          repartidor: repartidor,
          id_repartidor: idRepartidor,
          // Información del pedido
          precio: precioTotal,
          puntos: puntos,
          multiplicador_de_puntos: datosPedido.multiplicador_de_puntos,
          beneficios: datosPedido.beneficios || [],
          elementos: datosPedido.elementos || [],
          fecha_entrega: datosPedido.fecha_entrega,
          fecha_creacion: datosPedido.fecha_creacion,
          fecha_pedido: datosPedido.fecha_pedido,
          cliente_email: datosPedido.cliente_email,
          preference_id: datosPedido.preference_id,
          task_token_cocina: datosPedido.task_token_cocina,
          imagen_combo_url: datosPedido.imagen_combo_url,
          // Información de workflow
          cocina: datosCocina,
          empaquetamiento: datosEmpaquetamiento,
          delivery: datosDelivery
        };
        
        setOrder(pedidoTransformado);
        setCurrentStatus(pedidoTransformado.status);
      } catch (err) {
        console.error('Error al cargar pedido:', err);
        setError(err.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      cargarPedido();
    }
  }, [id]);

  const obtenerImagenAleatoria = () => {
    const imagenes = [duoBravasoImage, duplaNavidenaImage, duoQuesoTocinoImage, personalBravazoImage];
    return imagenes[Math.floor(Math.random() * imagenes.length)];
  };

  const calcularTiempoEstimado = (estado) => {
    const tiempos = {
      'pagado': '30-45 min',
      'cocina': '15-20 min',
      'empaquetamiento': '10-15 min',
      'delivery': 'En camino',
      'entregado': 'Entregado',
      'PAGADO': '30-45 min',
      'COCINA': '15-20 min',
      'EMPAQUETAMIENTO': '10-15 min',
      'DELIVERY': 'En camino',
      'ENTREGADO': 'Entregado'
    };
    
    if (!estado) return '30-45 min';
    
    const estadoNormalizado = estado.toUpperCase();
    return tiempos[estadoNormalizado] || tiempos[estado.toLowerCase()] || '30-45 min';
  };

  // Función auxiliar para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return new Date().toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async () => {
    if (!order || cambiandoEstado) return;
    
    try {
      setCambiandoEstado(true);
      
      const estadoBackend = mapearEstadoBackend(currentStatus) || order.estado_backend;
      const siguientePaso = obtenerSiguientePaso(estadoBackend);
      
      if (!siguientePaso) {
        setPopup({ mostrar: true, mensaje: 'No hay siguiente paso disponible', tipo: 'error' });
        setCambiandoEstado(false);
        return;
      }
      
      const datosAdicionales = {};
      
      if (!order.tenant_id) {
        setPopup({ mostrar: true, mensaje: 'El pedido no tiene tenant_id. No se puede cambiar el estado.', tipo: 'error' });
        setCambiandoEstado(false);
        return;
      }
      
      const uuid = order.uuid || order.id_pedido || order.id || id;
      if (!uuid) {
        setPopup({ mostrar: true, mensaje: 'El pedido no tiene uuid. No se puede cambiar el estado.', tipo: 'error' });
        setCambiandoEstado(false);
        return;
      }
      
      datosAdicionales.tenant_id = order.tenant_id;
      
      let idEmpleadoUsuario = obtenerIdEmpleado();
      
      if (!idEmpleadoUsuario) {
        try {
          const tenantIdParaPerfil = obtenerTenantId();
          if (tenantIdParaPerfil) {
            const perfil = await obtenerPerfilEmpleado(tenantIdParaPerfil);
            if (perfil && perfil.id_empleado) {
              idEmpleadoUsuario = perfil.id_empleado;
            }
          }
        } catch (error) {
          console.warn('No se pudo obtener perfil del empleado, usando valores del localStorage:', error);
        }
      }
      
      if (!idEmpleadoUsuario) {
        setPopup({ mostrar: true, mensaje: 'No se encontró el id_empleado. Por favor, inicia sesión nuevamente.', tipo: 'error' });
        setCambiandoEstado(false);
        return;
      }
      
      if (siguientePaso.paso === 'delivery-entregado') {
        datosAdicionales.cliente_email = order.cliente_email || '';
        datosAdicionales.repartidor = order.repartidor || 'Repartidor Default';
        datosAdicionales.id_repartidor = order.id_repartidor || 'REP-001';
        datosAdicionales.origen = order.origen || order.delivery?.origen || 'LIMA - CENTRO, Av. Arequipa 123, Lima';
        datosAdicionales.destino = order.destino || order.delivery?.destino || 'MENDRANO SILVA';
      } else if (siguientePaso.paso === 'cocina-lista') {
        datosAdicionales.id_empleado = idEmpleadoUsuario;
      } else if (siguientePaso.paso === 'empaquetamiento-listo') {
        datosAdicionales.id_empleado = idEmpleadoUsuario;
        datosAdicionales.cliente_email = order.cliente_email || '';
        datosAdicionales.origen = order.origen || order.delivery?.origen || 'LIMA - CENTRO, Av. Arequipa 123, Lima';
        datosAdicionales.destino = order.destino || order.delivery?.destino || 'MENDRANO SILVA';
      }
      
      const jsonAEnviar = {
        tenant_id: order.tenant_id,
        uuid: uuid,
        paso: siguientePaso.paso
      };
      
      if (siguientePaso.paso === 'cocina-lista') {
        jsonAEnviar.id_empleado = datosAdicionales.id_empleado;
      } else if (siguientePaso.paso === 'empaquetamiento-listo') {
        jsonAEnviar.id_empleado = datosAdicionales.id_empleado;
        jsonAEnviar.cliente_email = datosAdicionales.cliente_email;
        jsonAEnviar.origen = datosAdicionales.origen;
        jsonAEnviar.destino = datosAdicionales.destino;
      } else if (siguientePaso.paso === 'delivery-entregado') {
        jsonAEnviar.cliente_email = datosAdicionales.cliente_email;
        jsonAEnviar.origen = datosAdicionales.origen;
        jsonAEnviar.destino = datosAdicionales.destino;
        jsonAEnviar.repartidor = datosAdicionales.repartidor;
        jsonAEnviar.id_repartidor = datosAdicionales.id_repartidor;
      }
      
      console.log('=== CONFIRMAR PASO ===');
      console.log('Estado actual del pedido:', order.estado_backend);
      console.log('Siguiente paso:', siguientePaso);
      console.log('Tenant ID (del pedido):', order.tenant_id);
      console.log('UUID (del pedido):', uuid);
      console.log('Datos adicionales:', datosAdicionales);
      console.log('JSON que se enviará:', JSON.stringify(jsonAEnviar, null, 2));
      
      await confirmarPaso(uuid, siguientePaso.paso, datosAdicionales);
      
      const tenantId = order.tenant_id || localStorage.getItem('tenant_id') || 'restaurante_central_01';
      const respuesta = await obtenerPedidoPorId(uuid, tenantId);
      const datosPedido = respuesta.pedido || respuesta;
      const datosCocina = respuesta.cocina || null;
      const datosEmpaquetamiento = respuesta.empaquetamiento || null;
      const datosDelivery = respuesta.delivery || null;
      
      const origen = datosDelivery?.origen || null;
      const destino = datosDelivery?.destino || null;
      const repartidor = datosDelivery?.repartidor || null;
      const idRepartidor = datosDelivery?.id_repartidor || null;
      
      const uuidActualizado = datosPedido.uuid || datosPedido.id || datosPedido.id_pedido;
      const tenantIdActualizado = datosPedido.tenant_id || order.tenant_id;
      
      let descripcion = '';
      if (datosPedido.elementos && Array.isArray(datosPedido.elementos) && datosPedido.elementos.length > 0) {
        const nombresCombos = [];
        datosPedido.elementos.forEach(elemento => {
          if (elemento.combo && Array.isArray(elemento.combo)) {
            nombresCombos.push(...elemento.combo);
          }
        });
        if (nombresCombos.length > 0) {
          descripcion = nombresCombos.join(', ');
        } else {
            descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
          }
        } else if (datosPedido.elementos?.combo && Array.isArray(datosPedido.elementos.combo)) {
          const combos = datosPedido.elementos.combo.map(c => c.nombre || c.descripcion).join(', ');
        descripcion = combos;
      } else {
          descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
        }
        
        let precioTotal = 0;
      if (datosPedido.elementos && Array.isArray(datosPedido.elementos)) {
        precioTotal = datosPedido.elementos.reduce((sum, elemento) => {
          const precioElemento = elemento.precio || 0;
          const cantidad = elemento.cantidad_combo || 1;
          return sum + (precioElemento * cantidad);
        }, 0);
      } else if (datosPedido.precio) {
          precioTotal = datosPedido.precio;
        }
        
        let puntos = 0;
      if (precioTotal && datosPedido.multiplicador_de_puntos) {
        puntos = Math.round(precioTotal * datosPedido.multiplicador_de_puntos);
      } else if (datosPedido.puntos) {
          puntos = datosPedido.puntos;
        }
        
        const pedidoActualizado = {
        ...order,
        id: uuidActualizado || datosPedido.id || order.id,
        id_pedido: uuidActualizado || datosPedido.id || order.id_pedido,
        uuid: uuidActualizado,
        tenant_id: tenantIdActualizado,
        description: descripcion,
        status: mapearEstadoFrontend(datosPedido.estado_pedido),
        estado_backend: datosPedido.estado_pedido,
        time: calcularTiempoEstimado(datosPedido.estado_pedido),
        type: datosPedido.delivery ? 'Delivery' : 'Retiro en local',
        date: formatearFecha(datosPedido.fecha_pedido),
        origen: origen || datosDelivery?.origen || order.origen,
        destino: destino || datosDelivery?.destino || order.destino,
        repartidor: repartidor || datosDelivery?.repartidor || order.repartidor,
        id_repartidor: idRepartidor || datosDelivery?.id_repartidor || order.id_repartidor,
        precio: precioTotal,
        puntos: puntos,
        multiplicador_de_puntos: datosPedido.multiplicador_de_puntos,
        beneficios: datosPedido.beneficios || [],
        elementos: datosPedido.elementos || [],
        cliente_email: datosPedido.cliente_email,
        fecha_pedido: datosPedido.fecha_pedido,
        fecha_creacion: datosPedido.fecha_creacion,
        preference_id: datosPedido.preference_id,
        task_token_cocina: datosPedido.task_token_cocina,
        imagen_combo_url: datosPedido.imagen_combo_url,
        fecha_entrega: datosPedido.fecha_entrega,
        cocina: datosCocina,
        empaquetamiento: datosEmpaquetamiento,
        delivery: datosDelivery
      };
      
      console.log('Estado actualizado - estado_backend:', datosPedido.estado_pedido, 'status mapeado:', pedidoActualizado.status);
      
      setOrder(pedidoActualizado);
      setCurrentStatus(pedidoActualizado.status);
      
      console.log('currentStatus actualizado a:', pedidoActualizado.status);
      
      setPopup({ mostrar: true, mensaje: `Estado cambiado exitosamente a: ${siguientePaso.nombre}`, tipo: 'success' });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      
      if (err.message && err.message.includes('ya fue procesado o el tiempo de espera expiró')) {
        try {
          const uuid = order.uuid || order.id_pedido || order.id || id;
          const tenantId = order.tenant_id || localStorage.getItem('tenant_id') || 'restaurante_central_01';
          const respuesta = await obtenerPedidoPorId(uuid, tenantId);
          const datosPedido = respuesta.pedido || respuesta;
          const datosCocina = respuesta.cocina || null;
          const datosEmpaquetamiento = respuesta.empaquetamiento || null;
          const datosDelivery = respuesta.delivery || null;
          
          const origen = datosDelivery?.origen || null;
          const destino = datosDelivery?.destino || null;
          const repartidor = datosDelivery?.repartidor || null;
          const idRepartidor = datosDelivery?.id_repartidor || null;
          
          const uuidActualizado = datosPedido.uuid || datosPedido.id || datosPedido.id_pedido;
          const tenantIdActualizado = datosPedido.tenant_id || order.tenant_id;
          
          let descripcion = '';
          if (datosPedido.elementos && Array.isArray(datosPedido.elementos) && datosPedido.elementos.length > 0) {
            const nombresCombos = [];
            datosPedido.elementos.forEach(elemento => {
              if (elemento.combo && Array.isArray(elemento.combo)) {
                nombresCombos.push(...elemento.combo);
              }
            });
            if (nombresCombos.length > 0) {
              descripcion = nombresCombos.join(', ');
            } else {
              descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
            }
          } else if (datosPedido.elementos?.combo && Array.isArray(datosPedido.elementos.combo)) {
            const combos = datosPedido.elementos.combo.map(c => c.nombre || c.descripcion).join(', ');
            descripcion = combos;
          } else {
            descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
          }
          
          let precioTotal = 0;
          if (datosPedido.elementos && Array.isArray(datosPedido.elementos)) {
            precioTotal = datosPedido.elementos.reduce((sum, elemento) => {
              const precioElemento = elemento.precio || 0;
              const cantidad = elemento.cantidad_combo || 1;
              return sum + (precioElemento * cantidad);
            }, 0);
          } else if (datosPedido.precio) {
            precioTotal = datosPedido.precio;
          }
          
          let puntos = 0;
          if (precioTotal && datosPedido.multiplicador_de_puntos) {
            puntos = Math.round(precioTotal * datosPedido.multiplicador_de_puntos);
          } else if (datosPedido.puntos) {
            puntos = datosPedido.puntos;
          }
          
          const pedidoActualizado = {
            ...order,
            id: uuidActualizado || datosPedido.id || order.id,
            id_pedido: uuidActualizado || datosPedido.id || order.id_pedido,
            uuid: uuidActualizado,
            tenant_id: tenantIdActualizado,
            description: descripcion,
            status: mapearEstadoFrontend(datosPedido.estado_pedido),
            estado_backend: datosPedido.estado_pedido,
            time: calcularTiempoEstimado(datosPedido.estado_pedido),
            type: datosPedido.delivery ? 'Delivery' : 'Retiro en local',
            date: formatearFecha(datosPedido.fecha_pedido),
            origen: origen || datosDelivery?.origen || order.origen,
            destino: destino || datosDelivery?.destino || order.destino,
            repartidor: repartidor || datosDelivery?.repartidor || order.repartidor,
            id_repartidor: idRepartidor || datosDelivery?.id_repartidor || order.id_repartidor,
            precio: precioTotal,
            puntos: puntos,
            multiplicador_de_puntos: datosPedido.multiplicador_de_puntos,
            beneficios: datosPedido.beneficios || [],
            elementos: datosPedido.elementos || [],
            cliente_email: datosPedido.cliente_email,
            fecha_pedido: datosPedido.fecha_pedido,
            fecha_creacion: datosPedido.fecha_creacion,
            preference_id: datosPedido.preference_id,
            task_token_cocina: datosPedido.task_token_cocina,
            imagen_combo_url: datosPedido.imagen_combo_url,
            fecha_entrega: datosPedido.fecha_entrega,
            cocina: datosCocina,
            empaquetamiento: datosEmpaquetamiento,
            delivery: datosDelivery
          };
          
          setOrder(pedidoActualizado);
          setCurrentStatus(pedidoActualizado.status);
          
          setPopup({ mostrar: true, mensaje: 'El pedido fue actualizado. El estado actual es: ' + mapearEstadoFrontend(datosPedido.estado_pedido), tipo: 'success' });
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (reloadError) {
          console.error('Error al recargar pedido:', reloadError);
          setPopup({ mostrar: true, mensaje: `Error al cambiar estado: ${err.message}`, tipo: 'error' });
        }
      } else {
        setPopup({ mostrar: true, mensaje: `Error al cambiar estado: ${err.message}`, tipo: 'error' });
      }
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleIniciarWorkflow = async () => {
    if (!order || iniciandoWorkflow) {
      console.log('handleIniciarWorkflow: Ya está ejecutándose o no hay pedido, cancelando...');
      return;
    }
    
    try {
      setIniciandoWorkflow(true);
      setError(null);
      
      console.log('handleIniciarWorkflow: Iniciando workflow...');
      
      const tenant_id = order.tenant_id || 'restaurante_central_01';
      const uuid = order.uuid || order.id_pedido || order.id || id;
      const cliente_email = order.cliente_email || '';
      const origen = order.origen || order.delivery?.origen || 'LIMA - CENTRO, Av. Arequipa 123, Lima';
      const destino = order.destino || order.delivery?.destino || 'MENDRANO SILVA';
      
      if (!uuid || !cliente_email) {
        setPopup({ mostrar: true, mensaje: 'Faltan datos necesarios para iniciar el workflow (uuid o cliente_email)', tipo: 'error' });
        setIniciandoWorkflow(false);
        return;
      }
      
      console.log('Iniciar workflow - Datos:', { tenant_id, uuid, cliente_email, origen, destino });
      
      await iniciarWorkflow(tenant_id, uuid, cliente_email, origen, destino);
      
      const respuesta = await obtenerPedidoPorId(uuid, null);
      const datosPedido = respuesta.pedido || respuesta;
      const datosCocina = respuesta.cocina || null;
      const datosEmpaquetamiento = respuesta.empaquetamiento || null;
      const datosDelivery = respuesta.delivery || null;
      
      const origenActualizado = datosDelivery?.origen || null;
      const destinoActualizado = datosDelivery?.destino || null;
      const repartidor = datosDelivery?.repartidor || null;
      const idRepartidor = datosDelivery?.id_repartidor || null;
      
      const uuidActualizado = datosPedido.uuid || datosPedido.id || datosPedido.id_pedido;
      const tenantIdActualizado = datosPedido.tenant_id || order.tenant_id;
      
      let descripcion = '';
      if (datosPedido.elementos && Array.isArray(datosPedido.elementos) && datosPedido.elementos.length > 0) {
        const nombresCombos = [];
        datosPedido.elementos.forEach(elemento => {
          if (elemento.combo && Array.isArray(elemento.combo)) {
            nombresCombos.push(...elemento.combo);
          }
        });
        if (nombresCombos.length > 0) {
          descripcion = nombresCombos.join(', ');
        } else {
          descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
        }
      } else if (datosPedido.elementos?.combo && Array.isArray(datosPedido.elementos.combo)) {
        const combos = datosPedido.elementos.combo.map(c => c.nombre || c.descripcion).join(', ');
        descripcion = combos;
      } else {
        descripcion = `Pedido #${uuidActualizado || 'N/A'}`;
      }
      
      let precioTotal = 0;
      if (datosPedido.elementos && Array.isArray(datosPedido.elementos)) {
        precioTotal = datosPedido.elementos.reduce((sum, elemento) => {
          const precioElemento = elemento.precio || 0;
          const cantidad = elemento.cantidad_combo || 1;
          return sum + (precioElemento * cantidad);
        }, 0);
      } else if (datosPedido.precio) {
        precioTotal = datosPedido.precio;
      }
      
      let puntos = 0;
      if (precioTotal && datosPedido.multiplicador_de_puntos) {
        puntos = Math.round(precioTotal * datosPedido.multiplicador_de_puntos);
      } else if (datosPedido.puntos) {
        puntos = datosPedido.puntos;
      }
      
      const pedidoActualizado = {
        ...order,
        id: uuidActualizado || datosPedido.id || order.id,
        id_pedido: uuidActualizado || datosPedido.id || order.id_pedido,
        uuid: uuidActualizado,
        tenant_id: tenantIdActualizado,
        description: descripcion,
        status: mapearEstadoFrontend(datosPedido.estado_pedido),
        estado_backend: datosPedido.estado_pedido,
        time: calcularTiempoEstimado(datosPedido.estado_pedido),
        type: datosPedido.delivery ? 'Delivery' : 'Retiro en local',
        date: formatearFecha(datosPedido.fecha_pedido),
        origen: origenActualizado || datosDelivery?.origen || order.origen,
        destino: destinoActualizado || datosDelivery?.destino || order.destino,
        repartidor: repartidor || datosDelivery?.repartidor || order.repartidor,
        id_repartidor: idRepartidor || datosDelivery?.id_repartidor || order.id_repartidor,
        precio: precioTotal,
        puntos: puntos,
        multiplicador_de_puntos: datosPedido.multiplicador_de_puntos,
        beneficios: datosPedido.beneficios || [],
        elementos: datosPedido.elementos || [],
        cliente_email: datosPedido.cliente_email,
        fecha_pedido: datosPedido.fecha_pedido,
        fecha_creacion: datosPedido.fecha_creacion,
        preference_id: datosPedido.preference_id,
        task_token_cocina: datosPedido.task_token_cocina,
        imagen_combo_url: datosPedido.imagen_combo_url,
        fecha_entrega: datosPedido.fecha_entrega,
        cocina: datosCocina,
        empaquetamiento: datosEmpaquetamiento,
        delivery: datosDelivery
      };
      
      setOrder(pedidoActualizado);
      setCurrentStatus(pedidoActualizado.status);
      
      setPopup({ mostrar: true, mensaje: 'Workflow iniciado exitosamente. El pedido ahora está en COCINA.', tipo: 'success' });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar workflow:', err);
      setPopup({ mostrar: true, mensaje: `Error al iniciar workflow: ${err.message}`, tipo: 'error' });
    } finally {
      setIniciandoWorkflow(false);
    }
  };

  const getNextStatus = () => {
    if (!order) {
      console.log('getNextStatus: No hay pedido');
      return null;
    }
    
    const estadoBackend = mapearEstadoBackend(currentStatus) || order.estado_backend;
    console.log('getNextStatus - estadoBackend:', estadoBackend, 'currentStatus:', currentStatus, 'order.estado_backend:', order.estado_backend);
    
    const siguientePaso = obtenerSiguientePaso(estadoBackend);
    console.log('getNextStatus - siguientePaso:', siguientePaso);
    
    if (!siguientePaso) {
      console.log('getNextStatus: No hay siguiente paso');
      return null;
    }
    
    const rolEmpleado = obtenerRolEmpleado();
    const rolDesdeStorage = localStorage.getItem('rol_empleado');
    console.log('getNextStatus - rolEmpleado:', rolEmpleado, 'rolDesdeStorage:', rolDesdeStorage, 'siguientePaso.paso:', siguientePaso.paso);
    console.log('getNextStatus - Comparación:', {
      'rolEmpleado === cocinero': rolEmpleado === 'cocinero',
      'rolDesdeStorage === cocinero': rolDesdeStorage === 'cocinero',
      'siguientePaso.paso': siguientePaso.paso
    });
    
    if (rolEmpleado === 'administrador' || rolDesdeStorage === 'administrador') {
      console.log('getNextStatus: Administrador puede hacer cualquier paso');
      return siguientePaso.nombre;
    }
    
    if (siguientePaso.paso === 'cocina-lista' && (rolEmpleado === 'cocinero' || rolDesdeStorage === 'cocinero')) {
      console.log('getNextStatus: Cocinero puede confirmar cocina-lista');
      return siguientePaso.nombre;
    }
    
    if (siguientePaso.paso === 'empaquetamiento-listo' && (rolEmpleado === 'empaque' || rolDesdeStorage === 'empaque')) {
      console.log('getNextStatus: Empaque puede confirmar empaquetamiento-listo');
      return siguientePaso.nombre;
    }
    
    if (siguientePaso.paso === 'delivery-entregado' && (rolEmpleado === 'repartidor' || rolDesdeStorage === 'repartidor')) {
      console.log('getNextStatus: Repartidor puede confirmar delivery-entregado');
      return siguientePaso.nombre;
    }
    
    // Si el rol no coincide, no mostrar el botón
    console.log('getNextStatus: Rol no coincide con el paso requerido');
    return null;
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAGADO':
        return '#6c757d';
      case 'COCINA':
        return '#FFB500';
      case 'EMPAQUETAMIENTO':
        return '#111788';
      case 'DELIVERY':
        return '#f61422';
      case 'ENTREGADO':
        return '#28a745';
      default:
        return '#666';
    }
  };

  // Función para generar horas para cada estado
  const generateTimeForStatus = (index, currentIndex, baseDate) => {
    // Extraer hora de la fecha base (formato: "15 Ene 2025, 14:30")
    const timeMatch = baseDate.match(/(\d{1,2}):(\d{2})/);
    let hours = 14;
    let minutes = 30;
    
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = parseInt(timeMatch[2]);
    }
    
    // Calcular tiempo para cada estado (minutos desde el inicio)
    const timeIncrements = [0, 15, 5, 10, 5]; // minutos acumulados para cada estado
    let totalMinutes = 0;
    
    for (let i = 0; i <= index; i++) {
      if (i < timeIncrements.length) {
        totalMinutes += timeIncrements[i];
      }
    }
    
    // Calcular la hora final
    let finalHours = hours;
    let finalMinutes = minutes + totalMinutes;
    
    // Ajustar si los minutos exceden 60
    while (finalMinutes >= 60) {
      finalMinutes -= 60;
      finalHours += 1;
    }
    
    // Ajustar si las horas exceden 24
    if (finalHours >= 24) {
      finalHours -= 24;
    }
    
    const formattedHours = finalHours.toString().padStart(2, '0');
    const formattedMinutes = finalMinutes.toString().padStart(2, '0');
    
    if (index === currentIndex) {
      return 'Ahora';
    } else if (index < currentIndex) {
      // Estados completados: mostrar hora calculada
      return `${formattedHours}:${formattedMinutes}`;
    } else {
      // Estados futuros: mostrar hora estimada
      return `${formattedHours}:${formattedMinutes}`;
    }
  };

  // Definir la línea de tiempo basada en el estado actual
  const getTimeline = (status) => {
    const statusFlow = ['PAGADO', 'COCINA', 'EMPAQUETAMIENTO', 'DELIVERY', 'ENTREGADO'];
    const currentIndex = statusFlow.indexOf(status?.toUpperCase());
    
    return statusFlow.map((statusName, index) => {
      const completed = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const time = generateTimeForStatus(index, currentIndex, order?.date || '');
      
      return {
        status: statusName,
        completed: completed,
        isCurrent: isCurrent,
        time: time
      };
    });
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-container">
        <div className="order-not-found">
          <h2>{error || 'Pedido no encontrado'}</h2>
          <button onClick={() => navigate('/orders')} className="back-btn">
            Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  const estadoParaTimeline = currentStatus || order?.status || 'Desconocido';
  console.log('Estado para timeline:', estadoParaTimeline, 'currentStatus:', currentStatus, 'order.status:', order?.status, 'order.estado_backend:', order?.estado_backend);
  
  const timeline = getTimeline(estadoParaTimeline);
  const nextStatus = getNextStatus();

  return (
    <div className="order-detail-container">
      {/* Header Principal */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-container">
            <img src={logo} alt="Bembos Logo" className="logo" />
          </div>
          <nav className="main-nav">
            <button onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </button>
            <button onClick={() => navigate('/orders')} className="nav-item" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Pedidos</span>
            </button>
            <button onClick={() => navigate('/profile')} className="nav-item" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              <span>Perfil</span>
            </button>
          </nav>
          <div className="header-right">
            <div className="user-info-container">
              <button className="logout-btn-static" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="order-detail-main-content">
        <div className="order-detail-wrapper">
          <button onClick={() => navigate('/orders')} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Volver a pedidos
          </button>

          <div className="order-detail-content">
            {/* Información del Pedido */}
            <div className="order-info-section">
              <div className="order-image-large">
                <img src={order.image} alt={order.name} className="order-detail-image" />
              </div>
              
              <div className="order-details-section">
                <h1 className="order-detail-name">{order.name}</h1>
                <p className="order-detail-description">{order.description}</p>
                
                <div className="order-detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-label">Estado actual:</span>
                    <span 
                      className="detail-status" 
                      style={{ color: getStatusColor(currentStatus || order.status) }}
                    >
                      {currentStatus || order.status}
                    </span>
                  </div>
                  
                  <div className="detail-info-item">
                    <span className="detail-label">Tiempo estimado:</span>
                    <span className="detail-time">{order.time || '30-45 min'}</span>
                  </div>
                  
                  <div className="detail-info-item">
                    <span className="detail-label">Tipo de entrega:</span>
                    <span className="detail-type">
                      {order.type === 'Retiro en local' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"></path>
                          <path d="M5 8h10"></path>
                        </svg>
                      )}
                      {order.type}
                    </span>
                  </div>
                  
                  <div className="detail-info-item">
                    <span className="detail-label">Fecha del pedido:</span>
                    <span className="detail-date">{order.date}</span>
                  </div>
                  
                  <div className="detail-info-item">
                    <span className="detail-label">Número de pedido:</span>
                    <span className="detail-order-number">#{order.id ? order.id.toString().padStart(6, '0') : (order.uuid || order.id_pedido || 'N/A')}</span>
                  </div>
                  
                  {order.precio !== undefined && (
                    <div className="detail-info-item">
                      <span className="detail-label">Precio:</span>
                      <span className="detail-price" style={{ color: '#111788', fontWeight: 700, fontSize: '1.1rem' }}>
                        S/ {order.precio.toFixed(2)}
                      </span>
                </div>
                  )}
                  
                  {order.puntos !== undefined && (
                    <div className="detail-info-item">
                      <span className="detail-label">Puntos:</span>
                      <span className="detail-points" style={{ color: '#f61422', fontWeight: 700, fontSize: '1.1rem' }}>
                        {order.puntos} pts
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Elementos del pedido */}
                {order.elementos && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                      Elementos del pedido
                    </h3>
                    
                    {/* Nueva estructura: elementos es un array */}
                    {Array.isArray(order.elementos) && order.elementos.length > 0 ? (
                      order.elementos.map((elemento, index) => (
                        <div key={index} style={{ 
                          marginBottom: '1rem',
                          padding: '0.75rem', 
                          backgroundColor: '#f9f9f9', 
                          borderRadius: '6px'
                        }}>
                          {/* Combos */}
                          {elemento.combo && Array.isArray(elemento.combo) && elemento.combo.length > 0 && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.25rem' }}>
                                {elemento.combo.join(', ')}
                              </div>
                              {elemento.precio && (
                                <div style={{ fontSize: '0.85rem', color: '#111788', fontWeight: 600 }}>
                                  Precio: S/ {elemento.precio.toFixed(2)}
                                </div>
                              )}
                              {elemento.cantidad_combo && (
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                  Cantidad: {elemento.cantidad_combo}
                                </div>
                              )}
                              {elemento.cantidad_combo && elemento.precio && (
                                <div style={{ fontSize: '0.85rem', color: '#333', fontWeight: 600, marginTop: '0.25rem' }}>
                                  Subtotal: S/ {(elemento.precio * elemento.cantidad_combo).toFixed(2)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Productos */}
                          {elemento.productos && (
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              {elemento.productos.hamburguesa && elemento.productos.hamburguesa.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <strong>Hamburguesas:</strong> {elemento.productos.hamburguesa.map(h => h.nombre || h).join(', ')}
                                </div>
                              )}
                              {elemento.productos.papas && elemento.productos.papas.length > 0 && (
                                <div>Papas: {elemento.productos.papas.join(', ')}</div>
                              )}
                              {elemento.productos.complementos && elemento.productos.complementos.length > 0 && (
                                <div>Complementos: {elemento.productos.complementos.join(', ')}</div>
                              )}
                              {elemento.productos.adicionales && elemento.productos.adicionales.length > 0 && (
                                <div>Adicionales: {elemento.productos.adicionales.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Estructura antigua (por compatibilidad) */
                      order.elementos.combo && Array.isArray(order.elementos.combo) && order.elementos.combo.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#666' }}>
                            Combos:
                          </h4>
                          {order.elementos.combo.map((combo, index) => (
                            <div key={index} style={{ 
                              padding: '0.75rem', 
                              backgroundColor: '#f9f9f9', 
                              borderRadius: '6px',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.25rem' }}>
                                {combo.nombre || combo.id_combo}
                              </div>
                              {combo.descripcion && (
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                  {combo.descripcion}
                                </div>
                              )}
                              {combo.precio_unitario && (
                                <div style={{ fontSize: '0.85rem', color: '#111788', fontWeight: 600 }}>
                                  S/ {combo.precio_unitario.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
                
                {/* Beneficios */}
                {order.beneficios && order.beneficios.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                      Beneficios
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {order.beneficios.map((beneficio, index) => (
                        <span 
                          key={index}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          {beneficio.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información de delivery */}
                {order.destino && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                      Información de entrega
                    </h3>
                    {order.origen && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Origen: </span>
                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{order.origen}</span>
                      </div>
                    )}
                    {order.destino && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Destino: </span>
                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{order.destino}</span>
                      </div>
                    )}
                    {order.repartidor && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>Repartidor: </span>
                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{order.repartidor}</span>
                        {order.id_repartidor && (
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({order.id_repartidor})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            </div>

            {/* Línea de Tiempo */}
            <div className="timeline-section">
              <h2 className="timeline-title">Estado del pedido</h2>
              <div className="timeline-horizontal">
                {timeline.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className={`timeline-item-horizontal ${item.completed ? 'completed' : ''} ${item.isCurrent ? 'current' : ''}`}>
                      <div className="timeline-marker-horizontal">
                        {item.completed && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <div className="timeline-content-horizontal">
                        <h3 className="timeline-status-horizontal">{item.status}</h3>
                        <p className="timeline-time-horizontal">{item.time}</p>
                      </div>
                    </div>
                    {index < timeline.length - 1 && (
                      <div className={`timeline-line-horizontal ${item.completed ? 'completed' : ''}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Información de debug (temporal) */}
              {order && order.estado_backend === 'PAGADO' && (obtenerRolEmpleado() === 'administrador' || localStorage.getItem('rol_empleado') === 'administrador') && (
                <div className="status-change-section">
                  <button 
                    className="change-status-btn"
                    onClick={handleIniciarWorkflow}
                    disabled={iniciandoWorkflow}
                    style={{ backgroundColor: '#28a745' }}
                  >
                    {iniciandoWorkflow ? 'Iniciando workflow...' : 'Cambiar de PAGADO a COCINA'}
                  </button>
                </div>
              )}
              
              {order && (order.estado_backend === 'COCINA' || order.estado_backend === 'cocina') && (obtenerRolEmpleado() === 'cocinero' || localStorage.getItem('rol_empleado') === 'cocinero') && (
                <div className="status-change-section">
                  <button 
                    className="change-status-btn"
                    onClick={handleStatusChange}
                    disabled={cambiandoEstado}
                  >
                    {cambiandoEstado ? 'Cambiando estado...' : 'Cambiar de COCINA a EMPAQUETAMIENTO'}
                  </button>
            </div>
              )}
              
              {order && (order.estado_backend === 'EMPAQUETAMIENTO' || order.estado_backend === 'empaquetamiento') && (obtenerRolEmpleado() === 'empaque' || localStorage.getItem('rol_empleado') === 'empaque') && (
                <div className="status-change-section">
                  <button 
                    className="change-status-btn"
                    onClick={handleStatusChange}
                    disabled={cambiandoEstado}
                  >
                    {cambiandoEstado ? 'Cambiando estado...' : 'Cambiar de EMPAQUETAMIENTO a DELIVERY'}
                  </button>
          </div>
              )}
              
              {order && (order.estado_backend === 'DELIVERY' || order.estado_backend === 'delivery') && (obtenerRolEmpleado() === 'repartidor' || localStorage.getItem('rol_empleado') === 'repartidor') && (
                <div className="status-change-section">
                  <button 
                    className="change-status-btn"
                    onClick={handleStatusChange}
                    disabled={cambiandoEstado}
                  >
                    {cambiandoEstado ? 'Cambiando estado...' : 'Cambiar de DELIVERY a ENTREGADO'}
                  </button>
        </div>
              )}
              
              {/* Mostrar mensaje si no hay botón pero hay un siguiente paso */}
              {!nextStatus && order && (() => {
                const estadoBackend = mapearEstadoBackend(currentStatus) || order.estado_backend;
                const siguientePaso = obtenerSiguientePaso(estadoBackend);
                if (siguientePaso) {
                  return (
                    <div className="status-change-section">
                      <div style={{ 
                        padding: '1rem', 
                        backgroundColor: '#fff3cd', 
                        borderRadius: '6px',
                        color: '#856404',
                        textAlign: 'center'
                      }}>
                        No puedes cambiar el estado. Tu rol {obtenerRolEmpleado() || 'no definido'} no tiene permisos para este paso.
      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {popup.mostrar && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setPopup({ mostrar: false, mensaje: '', tipo: 'success' })}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '2.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              backgroundColor: popup.tipo === 'success' ? '#28a745' : '#f61422',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {popup.tipo === 'success' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>

            <h2 style={{
              color: '#333',
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1rem',
              marginTop: 0
            }}>
              {popup.tipo === 'success' ? '¡Éxito!' : 'Error'}
            </h2>

            <p style={{
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              {popup.mensaje}
            </p>

            <button
              onClick={() => setPopup({ mostrar: false, mensaje: '', tipo: 'success' })}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                backgroundColor: popup.tipo === 'success' ? '#28a745' : '#f61422',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = popup.tipo === 'success' ? '#218838' : '#d0121f'}
              onMouseOut={(e) => e.target.style.backgroundColor = popup.tipo === 'success' ? '#28a745' : '#f61422'}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;


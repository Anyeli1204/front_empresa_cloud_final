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
  mapearEstadoFrontend, 
  mapearEstadoBackend,
  obtenerSiguientePaso 
} from '../services/pedidosApi';
import { obtenerRolEmpleado, obtenerIdEmpleado, cerrarSesion } from '../utils/sessionUtils';
import './OrderDetail.css';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const tenantId = localStorage.getItem('tenant_id') || 'restaurante_central_01';
        
        const respuesta = await obtenerPedidoPorId(id, tenantId);
        
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
        const tenantIdDelPedido = datosPedido.tenant_id || tenantId;
        
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
      'cocina': '15-20 min',
      'empaquetamiento': 'Listo',
      'delivery': '8-12 min',
      'entregado': 'Entregado'
    };
    return tiempos[estado] || '--';
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
        alert('No hay siguiente paso disponible');
        return;
      }
      
      const datosAdicionales = {};
      const idEmpleado = obtenerIdEmpleado();
      
      if (order.tenant_id) {
        datosAdicionales.tenant_id = order.tenant_id;
      }
      
      if (siguientePaso.paso === 'delivery-entregado') {
        const repartidor = prompt('Ingrese el nombre del repartidor:');
        const idRepartidor = prompt('Ingrese el ID del repartidor:');
        
        if (repartidor && idRepartidor) {
          datosAdicionales.repartidor = repartidor;
          datosAdicionales.id_repartidor = idRepartidor;
          datosAdicionales.origen = order.origen || order.delivery?.origen || '';
          datosAdicionales.destino = order.destino || order.delivery?.destino || '';
          
          if (!datosAdicionales.origen) {
            const origenInput = prompt('Ingrese el origen (dirección de recogida):');
            if (origenInput) datosAdicionales.origen = origenInput;
          }
          if (!datosAdicionales.destino) {
            const destinoInput = prompt('Ingrese el destino (dirección de entrega):');
            if (destinoInput) datosAdicionales.destino = destinoInput;
          }
          
          if (!datosAdicionales.repartidor || !datosAdicionales.id_repartidor || !datosAdicionales.origen || !datosAdicionales.destino) {
            alert('Se requiere el nombre, ID del repartidor, origen y destino');
            setCambiandoEstado(false);
            return;
          }
        } else {
          alert('Se requiere el nombre e ID del repartidor');
          setCambiandoEstado(false);
          return;
        }
      } else if (idEmpleado) {
        datosAdicionales.id_empleado = idEmpleado;
      }
      
      const uuid = order.uuid || order.id_pedido || order.id || id;
      console.log('Confirmar paso - UUID:', uuid, 'Paso:', siguientePaso.paso, 'Datos:', datosAdicionales);
      
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
      
      setOrder(pedidoActualizado);
      setCurrentStatus(pedidoActualizado.status);
      
      alert(`Estado cambiado exitosamente a: ${siguientePaso.nombre}`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert(`Error al cambiar estado: ${err.message}`);
    } finally {
      setCambiandoEstado(false);
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
    switch (status) {
      case 'En preparación':
        return '#FFB500';
      case 'Listo para retirar':
        return '#111788';
      case 'En camino':
        return '#f61422';
      case 'Entregado':
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
    const statusFlow = ['En preparación', 'Listo para retirar', 'En camino', 'Entregado'];
    const currentIndex = statusFlow.indexOf(status);
    
    return statusFlow.map((statusName, index) => {
      const completed = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const time = generateTimeForStatus(index, currentIndex, order.date);
      
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

  const timeline = getTimeline(currentStatus || order.status);
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
            <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </a>
            <a onClick={() => navigate('/orders')} className="nav-item" style={{ cursor: 'pointer' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Pedidos</span>
            </a>
            <a onClick={() => navigate('/profile')} className="nav-item" style={{ cursor: 'pointer' }}>
              <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Perfil</span>
            </a>
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
                    <span className="detail-time">{order.time}</span>
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
                
                {/* Información de workflow - Siempre mostrar los 3 estados */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                    Historial del workflow
                  </h3>
                  
                  {/* Estado: Cocina */}
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: order.cocina ? '#fff3e0' : '#f5f5f5', 
                    borderRadius: '6px',
                    opacity: order.cocina ? 1 : 0.6
                  }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                      Cocina {order.cocina?.status === 'terminado' ? '✓' : (order.estado_backend === 'cocina' ? '⏳' : '○')}
                    </div>
                    {order.cocina?.id_empleado ? (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Empleado: {order.cocina.id_empleado}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                        Pendiente
                      </div>
                    )}
                    {order.cocina?.hora_comienzo && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Inicio: {formatearFecha(order.cocina.hora_comienzo)}
                      </div>
                    )}
                    {order.cocina?.hora_fin && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Fin: {formatearFecha(order.cocina.hora_fin)}
                      </div>
                    )}
                  </div>
                  
                  {/* Estado: Empaquetamiento */}
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: order.empaquetamiento ? '#e3f2fd' : '#f5f5f5', 
                    borderRadius: '6px',
                    opacity: order.empaquetamiento ? 1 : 0.6
                  }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                      Empaquetamiento {order.empaquetamiento?.status === 'terminado' ? '✓' : (order.estado_backend === 'empaquetamiento' ? '⏳' : '○')}
                    </div>
                    {order.empaquetamiento?.id_empleado ? (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Empleado: {order.empaquetamiento.id_empleado}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                        Pendiente
                      </div>
                    )}
                    {order.empaquetamiento?.hora_comienzo && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Inicio: {formatearFecha(order.empaquetamiento.hora_comienzo)}
                      </div>
                    )}
                    {order.empaquetamiento?.hora_fin && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Fin: {formatearFecha(order.empaquetamiento.hora_fin)}
                      </div>
                    )}
                  </div>
                  
                  {/* Estado: Delivery */}
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: order.delivery ? '#fce4ec' : '#f5f5f5', 
                    borderRadius: '6px',
                    opacity: order.delivery ? 1 : 0.6
                  }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                      Delivery {order.delivery?.status === 'cumplido' ? '✓' : (order.estado_backend === 'delivery' ? '⏳' : '○')}
                    </div>
                    {order.delivery?.repartidor ? (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Repartidor: {order.delivery.repartidor} {order.delivery.id_repartidor && `(${order.delivery.id_repartidor})`}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                        Pendiente
                      </div>
                    )}
                    {order.delivery?.origen && (
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        Origen: {order.delivery.origen}
                      </div>
                    )}
                    {order.delivery?.destino && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Destino: {order.delivery.destino}
                      </div>
                    )}
                  </div>
                </div>
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
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                <div><strong>Debug Info:</strong></div>
                <div>Estado actual: {currentStatus || order.status}</div>
                <div>Estado backend: {order.estado_backend}</div>
                <div>Rol empleado: {obtenerRolEmpleado() || 'No encontrado'}</div>
                <div>Rol desde localStorage: {localStorage.getItem('rol_empleado') || 'No encontrado'}</div>
                <div>ID empleado: {obtenerIdEmpleado() || 'No encontrado'}</div>
                <div>ID desde localStorage: {localStorage.getItem('id_empleado') || 'No encontrado'}</div>
                <div>Siguiente paso disponible: {nextStatus || 'Ninguno'}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                  Todos los localStorage keys: {Object.keys(localStorage).filter(k => k.includes('empleado') || k.includes('rol') || k.includes('tenant')).join(', ')}
                </div>
              </div>
              
              {/* Botón para cambiar de estado */}
              {nextStatus && (
                <div className="status-change-section">
                  <button 
                    className="change-status-btn"
                    onClick={handleStatusChange}
                    disabled={cambiandoEstado}
                  >
                    {cambiandoEstado ? 'Cambiando estado...' : `Cambiar a: ${nextStatus}`}
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
                        No puedes cambiar el estado. Tu rol ({obtenerRolEmpleado() || 'no definido'}) no tiene permisos para este paso.
                        <br />
                        <small>Paso requerido: {siguientePaso.paso}</small>
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
    </div>
  );
};

export default OrderDetail;


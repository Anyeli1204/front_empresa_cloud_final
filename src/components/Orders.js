import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import duoBravasoImage from '../assets/duo bravaso.webp';
import duplaNavidenaImage from '../assets/dupla navideña.webp';
import duoQuesoTocinoImage from '../assets/duo queso tocinno.webp';
import personalBravazoImage from '../assets/Personal Bravado.webp';
import { listarPedidosPorEstados, mapearEstadoFrontend } from '../services/pedidosApi';
import { cerrarSesion } from '../utils/sessionUtils';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let estadosBackend = [];
        if (filterStatus === 'Todos') {
          estadosBackend = ['PAGADO', 'COCINA', 'EMPAQUETAMIENTO', 'DELIVERY', 'ENTREGADO'];
        } else if (filterStatus === 'PAGADO') {
          estadosBackend = ['PAGADO'];
        } else if (filterStatus === 'COCINA') {
          estadosBackend = ['COCINA'];
        } else if (filterStatus === 'EMPAQUETAMIENTO') {
          estadosBackend = ['EMPAQUETAMIENTO'];
        } else if (filterStatus === 'DELIVERY') {
          estadosBackend = ['DELIVERY'];
        } else if (filterStatus === 'ENTREGADO') {
          estadosBackend = ['ENTREGADO'];
        }
        
        const datos = await listarPedidosPorEstados(estadosBackend);
        
        const listaPedidos = datos.pedidos || (Array.isArray(datos) ? datos : []);
        
        const pedidosTransformados = listaPedidos.map(pedido => {
          const estadoPedido = pedido.estado_pedido || pedido.estado || pedido.status;
          const uuid = pedido.uuid;
          const idPedido = uuid || pedido.id || pedido.id_pedido;
          
          let descripcion = '';
          if (pedido.elementos && Array.isArray(pedido.elementos) && pedido.elementos.length > 0) {
            const nombresCombos = [];
            pedido.elementos.forEach(elemento => {
              if (elemento.combo && Array.isArray(elemento.combo)) {
                nombresCombos.push(...elemento.combo);
              }
            });
            if (nombresCombos.length > 0) {
              descripcion = nombresCombos.join(', ');
            } else {
              descripcion = 'Pedido personalizado';
            }
          } else if (pedido.elementos && pedido.elementos.combo) {
            const combos = pedido.elementos.combo || [];
            const hamburguesas = pedido.elementos.productos?.hamburguesa || [];
            if (combos.length > 0) {
              descripcion = combos.map(c => c.nombre || c.descripcion).join(', ');
            } else if (hamburguesas.length > 0) {
              descripcion = hamburguesas.map(h => h.nombre).join(', ');
            } else {
              descripcion = 'Pedido personalizado';
            }
          } else {
            descripcion = `Pedido ${idPedido}`;
          }
          
          let precioTotal = 0;
          if (pedido.elementos && Array.isArray(pedido.elementos)) {
            precioTotal = pedido.elementos.reduce((sum, elemento) => {
              const precioElemento = elemento.precio || 0;
              const cantidad = elemento.cantidad_combo || 1;
              return sum + (precioElemento * cantidad);
            }, 0);
          } else if (pedido.precio) {
            precioTotal = pedido.precio;
          }
          
          let puntos = 0;
          if (precioTotal && pedido.multiplicador_de_puntos) {
            puntos = Math.round(precioTotal * pedido.multiplicador_de_puntos);
          } else if (pedido.puntos) {
            puntos = pedido.puntos;
          }
          
          const imagenPedido = pedido.imagen_combo_url || obtenerImagenAleatoria();
          
          const nombrePedido = uuid ? `Pedido ${uuid.substring(0, 8)}...` : `Pedido ${idPedido || 'N/A'}`;
          
          return {
            id: uuid || idPedido,
            id_pedido: uuid || idPedido,
            uuid: uuid,
            tenant_id: pedido.tenant_id,
            image: imagenPedido,
            name: nombrePedido,
            description: descripcion,
            status: mapearEstadoFrontend(estadoPedido),
            estado_backend: estadoPedido,
            time: calcularTiempoEstimado(estadoPedido),
            type: pedido.delivery ? 'Delivery' : 'Retiro en local',
            date: formatearFecha(pedido.fecha_pedido || pedido.fecha_creacion || pedido.fecha || new Date()),
            origen: pedido.origen,
            destino: pedido.destino,
            id_cliente: pedido.id_cliente,
            nombre_cliente: pedido.nombre_cliente || pedido.cliente_email,
            cliente_email: pedido.cliente_email,
            precio: precioTotal,
            puntos: puntos,
            multiplicador_de_puntos: pedido.multiplicador_de_puntos,
            elementos: pedido.elementos,
            beneficios: pedido.beneficios,
            imagen_combo_url: pedido.imagen_combo_url,
            fecha_creacion: pedido.fecha_creacion,
            fecha_entrega: pedido.fecha_entrega,
            fecha_pedido: pedido.fecha_pedido,
            preference_id: pedido.preference_id,
            task_token_cocina: pedido.task_token_cocina,
            ...pedido
          };
        });
        
        setOrders(pedidosTransformados);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        console.error('Error completo:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        let mensajeError = err.message || 'Error al cargar los pedidos';
        if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED'))) {
          mensajeError = 'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        }
        
        setError(mensajeError);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    cargarPedidos();
  }, [filterStatus]);

  const obtenerImagenAleatoria = () => {
    const imagenes = [duoBravasoImage, duplaNavidenaImage, duoQuesoTocinoImage, personalBravazoImage];
    return imagenes[Math.floor(Math.random() * imagenes.length)];
  };

  const calcularTiempoEstimado = (estado) => {
    if (!estado) return '--';
    const estadoNormalizado = estado.toUpperCase();
    const tiempos = {
      'PAGADO': 'Pendiente',
      'COCINA': '15-20 min',
      'EMPAQUETAMIENTO': 'Listo',
      'DELIVERY': '8-12 min',
      'ENTREGADO': 'Entregado',
      'cocina': '15-20 min',
      'empaquetamiento': 'Listo',
      'delivery': '8-12 min',
      'entregado': 'Entregado'
    };
    return tiempos[estadoNormalizado] || tiempos[estado] || '--';
  };

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'Todos' || order.estado_backend?.toUpperCase() === filterStatus || order.status?.toUpperCase() === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, filterStatus]);


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

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="orders-container">
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

      <div className="orders-main-content">
        <div className="orders-wrapper">
          <h1>Pedidos del local</h1>
          
          <div className="orders-filters">
            <div className="search-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <span className="filter-label">Filtrar por estado:</span>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'Todos' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('Todos')}
                >
                  Todos
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'PAGADO' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('PAGADO')}
                >
                  PAGADO
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'COCINA' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('COCINA')}
                >
                  COCINA
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'EMPAQUETAMIENTO' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('EMPAQUETAMIENTO')}
                >
                  EMPAQUETAMIENTO
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'DELIVERY' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('DELIVERY')}
                >
                  DELIVERY
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'ENTREGADO' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('ENTREGADO')}
                >
                  ENTREGADO
                </button>
              </div>
            </div>
          </div>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Cargando pedidos...</p>
            </div>
          )}
          
          {error && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#f61422' }}>
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                Reintentar
              </button>
            </div>
          )}
          
          {!loading && !error && (
            <>
              {filteredOrders.length > 0 ? (
          <div className="orders-list">
                  {filteredOrders.map((order) => (
                <div 
                      key={order.id_pedido || order.id} 
                  className="order-card"
                      onClick={() => navigate(`/orders/${order.uuid || order.id_pedido || order.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="order-image-container">
                    <img src={order.image} alt={order.name} className="order-image" />
                  </div>
                  
                  <div className="order-details">
                    <h3 className="order-name">{order.name}</h3>
                    <p className="order-description">{order.description}</p>
                    
                    <div className="order-info-row">
                      <div className="order-info-item">
                        <span className="info-label">Estado:</span>
                        <span 
                          className="order-status" 
                          style={{ color: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="order-info-item">
                        <span className="info-label">Tiempo:</span>
                        <span className="order-time">{order.time}</span>
                      </div>
                    </div>
                    
                    <div className="order-info-row">
                      <div className="order-info-item">
                        <span className="info-label">Tipo:</span>
                        <span className="order-type">
                          {order.type === 'Retiro en local' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"></path>
                              <path d="M5 8h10"></path>
                            </svg>
                          )}
                          {order.type}
                        </span>
                      </div>
                      
                      <div className="order-info-item">
                        <span className="info-label">Fecha:</span>
                        <span className="order-date">{order.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 2rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <svg 
                    width="64" 
                    height="64" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#999" 
                    strokeWidth="2"
                    style={{ marginBottom: '1rem', opacity: 0.5 }}
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  <h2 style={{ color: '#333', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                    No hay pedidos disponibles
                  </h2>
                  <p style={{ color: '#666', fontSize: '1rem' }}>
                    {filterStatus === 'Todos' 
                      ? 'No se encontraron pedidos en el sistema.' 
                      : `No se encontraron pedidos con estado "${filterStatus}".`}
                  </p>
          </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;


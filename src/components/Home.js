import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion } from '../utils/sessionUtils';
import { 
  obtenerVentasPorSegmentos, 
  obtenerVentasPorEstado, 
  obtenerVentasPorCombinacion, 
  obtenerMargenesPorGanancia 
} from '../services/reportesApi';
import './Home.css';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import empleadosImage from '../assets/empleados.jpg';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportes, setReportes] = useState({
    ventasPorSegmentos: null,
    ventasPorEstado: null,
    ventasPorCombinacion: null,
    margenesPorGanancia: null
  });
  const [paginas, setPaginas] = useState({
    segmentos: 1,
    combinacion: 1,
    restaurantes: 1
  });
  const itemsPorPagina = 8;

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [segmentos, estado, combinacion, margenes] = await Promise.all([
          obtenerVentasPorSegmentos().catch(() => null),
          obtenerVentasPorEstado().catch(() => null),
          obtenerVentasPorCombinacion().catch(() => null),
          obtenerMargenesPorGanancia().catch(() => null)
        ]);
        
        const ventasPorCliente = segmentos?.ventas_por_cliente || (Array.isArray(segmentos) ? segmentos : null);
        
        const ventasPorEstadoArray = estado?.ventas_por_estado || (Array.isArray(estado) ? estado : null);
        
        const ventasPorCombo = combinacion?.ventas_por_combo || (Array.isArray(combinacion) ? combinacion : null);
        
        const ventasPorTenant = margenes?.ventas_por_tenant || (Array.isArray(margenes) ? margenes : null);
        
        setReportes({
          ventasPorSegmentos: ventasPorCliente,
          ventasPorEstado: ventasPorEstadoArray,
          ventasPorCombinacion: ventasPorCombo,
          margenesPorGanancia: ventasPorTenant
        });
      } catch (err) {
        console.error('Error al cargar reportes:', err);
        setError(err.message || 'Error al cargar los reportes');
      } finally {
        setLoading(false);
      }
    };
    
    cargarReportes();
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  const formatearMoneda = (valor) => {
    if (!valor && valor !== 0) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const obtenerTotalVentas = (item) => {
    return item.total_ventas || item.totalVentas || item.ventas || item.Ventas || item.total || 0;
  };

  const obtenerCantidadVendida = (item) => {
    return item.cantidad_vendida || item.cantidadVendida || item.cantidad || item.Cantidad || 0;
  };

  const cambiarPagina = (tipo, nuevaPagina) => {
    setPaginas(prev => ({
      ...prev,
      [tipo]: nuevaPagina
    }));
  };

  const obtenerItemsPaginados = (items, tipo) => {
    if (!Array.isArray(items)) return [];
    const inicio = (paginas[tipo] - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return items.slice(inicio, fin);
  };

  const obtenerTotalPaginas = (items) => {
    if (!Array.isArray(items)) return 0;
    return Math.ceil(items.length / itemsPorPagina);
  };

  return (
    <div className="home-container">
      <header className="home-header">
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

      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <img src={empleadosImage} alt="Empleados Bembos" className="empleados-image" />
            <div className="hero-overlay-dark">
              <h1 className="hero-title">Bienvenido a Bembos</h1>
            </div>
          </div>
        </section>

        {loading && (
          <section className="sales-summary">
            <div className="sales-header">
              <h2 className="sales-title">Cargando reportes...</h2>
            </div>
          </section>
        )}

        {error && (
          <section className="sales-summary">
            <div className="sales-header">
              <h2 className="sales-title" style={{ color: '#f61422' }}>Error: {error}</h2>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            {reportes.ventasPorEstado && Array.isArray(reportes.ventasPorEstado) && reportes.ventasPorEstado.length > 0 && (
              <section className="sales-summary">
                <div className="sales-header sales-header-yellow">
                  <h2 className="sales-title">📊 Ventas por Estado</h2>
                </div>
                <div className="sales-cards">
                  {reportes.ventasPorEstado.map((item, index) => {
                    const estadoPedido = item.estado_pedido || item.estado || item.Estado || 'Estado';
                    const totalVentas = item.total_ventas || 0;
                    
                    const estadoMostrar = estadoPedido.toUpperCase();
                    
                    const getEstadoColor = (estado) => {
                      const estadoUpper = estado.toUpperCase();
                      switch(estadoUpper) {
                        case 'PAGADO': return '#6c757d';
                        case 'COCINA': return '#FFB500';
                        case 'EMPAQUETAMIENTO': return '#111788';
                        case 'DELIVERY': return '#f61422';
                        case 'ENTREGADO': return '#28a745';
                        case 'COMPLETADO': return '#28a745';
                        default: return '#111788';
                      }
                    };
                    
                    return (
                      <div key={index} className="sales-card" style={{ borderTop: `4px solid ${getEstadoColor(estadoPedido)}` }}>
                        <div className="sales-card-icon" style={{ background: `linear-gradient(135deg, ${getEstadoColor(estadoPedido)} 0%, ${getEstadoColor(estadoPedido)}dd 100%)` }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                          </svg>
                        </div>
                        <div className="sales-card-content">
                          <h3 className="sales-card-label">{estadoMostrar}</h3>
                          <p className="sales-card-value" style={{ color: getEstadoColor(estadoPedido) }}>{formatearMoneda(totalVentas)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {reportes.ventasPorSegmentos && Array.isArray(reportes.ventasPorSegmentos) && reportes.ventasPorSegmentos.length > 0 && (
              <section className="sales-summary">
                <div className="sales-header">
                  <h2 className="sales-title">👥 Ventas por Cliente</h2>
                </div>
                <div className="sales-cards">
                  {obtenerItemsPaginados(reportes.ventasPorSegmentos, 'segmentos').map((item, index) => {
                    const totalVentas = item.total_ventas || 0;
                    const cantidadVendida = item.cantidad_vendida || 0;
                    const clienteEmail = item.cliente_email || 'Cliente';
                    const indiceReal = (paginas.segmentos - 1) * itemsPorPagina + index;
                    
                    return (
                      <div key={indiceReal} className="sales-card">
                  <div className="sales-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="sales-card-content">
                          <h3 className="sales-card-label" style={{ 
                            fontSize: '0.85rem',
                            wordBreak: 'break-word',
                            lineHeight: '1.3',
                            marginBottom: '0.5rem'
                          }}>
                            {clienteEmail}
                          </h3>
                          <p className="sales-card-value">{formatearMoneda(totalVentas)}</p>
                          <p className="sales-card-quantity">Cantidad: {cantidadVendida}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {obtenerTotalPaginas(reportes.ventasPorSegmentos) > 1 && (
                  <div className="pagination-controls">
                    <button
                      onClick={() => cambiarPagina('segmentos', paginas.segmentos - 1)}
                      disabled={paginas.segmentos === 1}
                      className="pagination-btn"
                    >
                      Anterior
                    </button>
                    <span className="pagination-info">
                      Página {paginas.segmentos} de {obtenerTotalPaginas(reportes.ventasPorSegmentos)}
                    </span>
                    <button
                      onClick={() => cambiarPagina('segmentos', paginas.segmentos + 1)}
                      disabled={paginas.segmentos >= obtenerTotalPaginas(reportes.ventasPorSegmentos)}
                      className="pagination-btn"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </section>
            )}

            {reportes.ventasPorCombinacion && Array.isArray(reportes.ventasPorCombinacion) && reportes.ventasPorCombinacion.length > 0 && (
              <section className="sales-summary">
                <div className="sales-header">
                  <h2 className="sales-title">🍔 Ventas por Combo</h2>
                </div>
                <div className="sales-cards">
                  {obtenerItemsPaginados(reportes.ventasPorCombinacion, 'combinacion').map((item, index) => {
                    const nombreCombo = item.combo || 'Combo';
                    const totalVentas = item.total_ventas || 0;
                    const cantidadVendida = item.cantidad_vendida || 0;
                    const indiceReal = (paginas.combinacion - 1) * itemsPorPagina + index;
                    
                    return (
                      <div key={indiceReal} className="sales-card">
                  <div className="sales-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                  <div className="sales-card-content">
                          <h3 className="sales-card-label" style={{ 
                            fontSize: '0.85rem',
                            wordBreak: 'break-word',
                            lineHeight: '1.3',
                            marginBottom: '0.5rem'
                          }}>
                            {nombreCombo}
                          </h3>
                          <p className="sales-card-value">{formatearMoneda(totalVentas)}</p>
                          <p className="sales-card-quantity">Cantidad: {cantidadVendida}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {obtenerTotalPaginas(reportes.ventasPorCombinacion) > 1 && (
                  <div className="pagination-controls">
                    <button
                      onClick={() => cambiarPagina('combinacion', paginas.combinacion - 1)}
                      disabled={paginas.combinacion === 1}
                      className="pagination-btn"
                    >
                      Anterior
                    </button>
                    <span className="pagination-info">
                      Página {paginas.combinacion} de {obtenerTotalPaginas(reportes.ventasPorCombinacion)}
                    </span>
                    <button
                      onClick={() => cambiarPagina('combinacion', paginas.combinacion + 1)}
                      disabled={paginas.combinacion >= obtenerTotalPaginas(reportes.ventasPorCombinacion)}
                      className="pagination-btn"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </section>
            )}

            {reportes.margenesPorGanancia && Array.isArray(reportes.margenesPorGanancia) && reportes.margenesPorGanancia.length > 0 && (
              <section className="sales-summary">
                <div className="sales-header sales-header-yellow">
                  <h2 className="sales-title">🏪 Ventas por Restaurante</h2>
                </div>
                <div className="sales-cards">
                  {obtenerItemsPaginados(reportes.margenesPorGanancia, 'restaurantes').map((item, index) => {
                    const nombreRestaurante = item.tenant_id || 'Restaurante';
                    const totalVentas = item.total_ventas || 0;
                    const cantidadPedidos = item.cantidad_pedidos || 0;
                    const indiceReal = (paginas.restaurantes - 1) * itemsPorPagina + index;
                    
                    return (
                      <div key={indiceReal} className="sales-card">
                  <div className="sales-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="sales-card-content">
                          <h3 className="sales-card-label" style={{ 
                            fontSize: '0.85rem',
                            wordBreak: 'break-word',
                            lineHeight: '1.3',
                            marginBottom: '0.5rem'
                          }}>
                            {nombreRestaurante}
                          </h3>
                          <p className="sales-card-value">{formatearMoneda(totalVentas)}</p>
                          <p className="sales-card-quantity">Pedidos: {cantidadPedidos}</p>
                  </div>
                </div>
                    );
                  })}
                </div>
                {obtenerTotalPaginas(reportes.margenesPorGanancia) > 1 && (
                  <div className="pagination-controls">
                    <button
                      onClick={() => cambiarPagina('restaurantes', paginas.restaurantes - 1)}
                      disabled={paginas.restaurantes === 1}
                      className="pagination-btn"
                    >
                      Anterior
                    </button>
                    <span className="pagination-info">
                      Página {paginas.restaurantes} de {obtenerTotalPaginas(reportes.margenesPorGanancia)}
                    </span>
                    <button
                      onClick={() => cambiarPagina('restaurantes', paginas.restaurantes + 1)}
                      disabled={paginas.restaurantes >= obtenerTotalPaginas(reportes.margenesPorGanancia)}
                      className="pagination-btn"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;


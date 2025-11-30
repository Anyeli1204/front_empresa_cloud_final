import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import { obtenerPerfilEmpleado, actualizarPerfilEmpleado } from '../services/empleadosApi';
import { obtenerTenantId, obtenerRolEmpleado, cerrarSesion } from '../utils/sessionUtils';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: '',
    nombre: '',
    apellidos: '',
    numero: '',
    fecha_nacimiento: ''
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantId = obtenerTenantId();
      console.log('Cargar perfil - tenantId desde localStorage:', tenantId);
      console.log('Cargar perfil - tenant_id key en localStorage:', localStorage.getItem('tenant_id'));
      console.log('Cargar perfil - Todos los keys de localStorage:', Object.keys(localStorage));
      
      if (!tenantId || tenantId === 'tenant2') {
        console.error('No hay tenant_id válido (email del empleado), redirigiendo a login');
        setError('No se encontró la información de sesión. Por favor, inicia sesión nuevamente.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      console.log('Llamando a obtenerPerfilEmpleado con tenantId:', tenantId);
      const datos = await obtenerPerfilEmpleado(tenantId);
      console.log('Perfil obtenido:', datos);
      
      setPerfil(datos);
      
      setFormData({
        descripcion: datos.descripcion || '',
        nombre: datos.nombre || '',
        apellidos: datos.apellidos || '',
        numero: datos.numero || datos.telefono || '',
        fecha_nacimiento: datos.fecha_nacimiento || ''
      });
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      console.error('Error completo:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError(null);
      
      const tenantId = obtenerTenantId();
      await actualizarPerfilEmpleado(tenantId, formData);
      
      await cargarPerfil();
      setEditando(false);
      setMostrarConfirmacion(true);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (perfil) {
      setFormData({
        descripcion: perfil.descripcion || '',
        nombre: perfil.nombre || '',
        apellidos: perfil.apellidos || '',
        numero: perfil.numero || perfil.telefono || '',
        fecha_nacimiento: perfil.fecha_nacimiento || ''
      });
    }
    setEditando(false);
    setError(null);
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  const rolEmpleado = obtenerRolEmpleado();

  if (loading) {
    return (
      <div className="profile-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !perfil) {
    return (
      <div className="profile-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f61422' }}>
          <p>Error: {error}</p>
          <button onClick={cargarPerfil} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
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
            <a onClick={() => navigate('/profile')} className="nav-item active" style={{ cursor: 'pointer' }}>
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

      <div className="profile-main-content">
        <div className="profile-wrapper">
          <h1>Mi Perfil</h1>
          
          {error && (
            <div style={{ 
              color: '#f61422', 
              fontSize: '0.9rem', 
              marginBottom: '1.5rem',
              padding: '0.75rem',
              backgroundColor: '#ffe6e6',
              borderRadius: '6px',
              border: '1px solid #f61422'
            }}>
              {error}
            </div>
          )}

          {perfil && (
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#111788" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="profile-header-info">
                  <h2>{perfil.nombre || ''} {perfil.apellidos || ''}</h2>
                  <p className="profile-email">{perfil.gmail || perfil.tenant_id || obtenerTenantId()}</p>
                  <span className="profile-rol">{rolEmpleado || perfil.rol || 'Empleado'}</span>
                </div>
                {!editando && (
                  <button className="edit-btn" onClick={() => setEditando(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar Perfil
                  </button>
                )}
              </div>

              <div className="profile-details">
                <div className="profile-section">
                  <h3>Información Personal</h3>
                  <div className="profile-fields">
                    <div className="profile-field">
                      <label>Nombre</label>
                      {editando ? (
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Nombre"
                        />
                      ) : (
                        <p>{perfil.nombre || 'No especificado'}</p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label>Apellidos</label>
                      {editando ? (
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          placeholder="Apellidos"
                        />
                      ) : (
                        <p>{perfil.apellidos || 'No especificado'}</p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label>Teléfono</label>
                      {editando ? (
                        <input
                          type="tel"
                          name="numero"
                          value={formData.numero}
                          onChange={handleChange}
                          placeholder="Número de teléfono"
                        />
                      ) : (
                        <p>{perfil.numero || perfil.telefono || 'No especificado'}</p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label>Fecha de Nacimiento</label>
                      {editando ? (
                        <input
                          type="date"
                          name="fecha_nacimiento"
                          value={formData.fecha_nacimiento}
                          onChange={handleChange}
                        />
                      ) : (
                        <p>{perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-ES') : 'No especificado'}</p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label>Tipo de Documento</label>
                      <p>{perfil.tipo_documento || 'No especificado'}</p>
                    </div>

                    <div className="profile-field">
                      <label>Documento</label>
                      <p>{perfil.documento || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Descripción</h3>
                  <div className="profile-field">
                    {editando ? (
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Escribe una descripción sobre ti..."
                        rows="4"
                      />
                    ) : (
                      <p>{perfil.descripcion || 'No hay descripción disponible'}</p>
                    )}
                  </div>
                </div>
              </div>

              {editando && (
                <div className="profile-actions">
                  <button className="cancel-btn" onClick={handleCancelar} disabled={guardando}>
                    Cancelar
                  </button>
                  <button className="save-btn" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mostrarConfirmacion && (
        <div 
          className="popup-overlay"
          onClick={() => setMostrarConfirmacion(false)}
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
        >
          <div 
            className="popup-content"
            onClick={(e) => e.stopPropagation()}
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
          >
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 style={{
              color: '#333',
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1rem',
              marginTop: 0
            }}>
              ¡Perfil Actualizado!
            </h2>

            <p style={{
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Tus cambios han sido guardados exitosamente.
            </p>

            <button
              onClick={() => setMostrarConfirmacion(false)}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                backgroundColor: '#111788',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0d1258'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#111788'}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


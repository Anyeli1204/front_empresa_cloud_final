import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import bembosImage from '../assets/bembos.jpg';
import { guardarSesion } from '../utils/sessionUtils';
import { loginEmpleado } from '../services/empleadosApi';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('cocinero');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const respuesta = await loginEmpleado(email, password, rol);
      
      guardarSesion({
        tenant_id: email,
        id_empleado: respuesta.id_empleado || respuesta.id || email,
        rol_empleado: rol,
        nombre_empleado: respuesta.nombre || email.split('@')[0],
        token: respuesta.token || respuesta.access_token || null
      });
      
      navigate('/orders');
    } catch (err) {
      console.error('Error en login:', err);
      
      const errorMessage = err.message || '';
      let mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (errorMessage.toLowerCase().includes('contraseña') || 
          errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('incorrecta') ||
          errorMessage.toLowerCase().includes('incorrect') ||
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('401') ||
          errorMessage.toLowerCase().includes('unauthorized')) {
        mensajeError = 'Contraseña incorrecta. Por favor, verifica tu contraseña e intenta nuevamente.';
      } else if (errorMessage.toLowerCase().includes('usuario') ||
                 errorMessage.toLowerCase().includes('user') ||
                 errorMessage.toLowerCase().includes('not found') ||
                 errorMessage.toLowerCase().includes('404')) {
        mensajeError = 'Usuario no encontrado. Verifica tu correo electrónico.';
      } else if (errorMessage) {
        mensajeError = errorMessage;
      }
      
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-container">
            <img src={logo} alt="Bembos Logo" className="logo" />
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-text-container">
                <span className="hello-text">¿No tienes una cuenta?</span>
                <span className="login-text" onClick={() => navigate('/register')}>Registrate</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="login-main-content">
        <div className="login-wrapper">
          <div className="login-left">
            <h2>INICIAR SESIÓN</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico *</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Ej. nombre@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol *</label>
                <select
                  id="rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="cocinero">Cocinero</option>
                  <option value="empaque">Empaque</option>
                  <option value="repartidor">Repartidor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Aa12345"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ 
                  color: '#f61422', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#ffe6e6',
                  borderRadius: '6px',
                  border: '1px solid #f61422',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f61422" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>

          <div className="login-right">
            <img src={bembosImage} alt="Bembos" className="bembos-image" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


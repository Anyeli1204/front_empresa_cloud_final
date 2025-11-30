import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/80da48178727205.Y3JvcCwxNjg0LDEzMTcsMCww.jpg';
import formImage from '../assets/WhatsApp-Image-2023-09-13-at-3.32.01-PM-4-1024x641 - copia.jpeg';
import { registrarEmpleado } from '../services/empleadosApi';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    documentType: 'DNI',
    document: '',
    phone: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    rol: 'cocinero'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const datosRegistro = {
        gmail: formData.email,
        nombre: formData.name,
        apellidos: formData.lastName,
        tipo_documento: formData.documentType,
        documento: formData.document,
        numero: formData.phone,
        fecha_nacimiento: formData.birthDate,
        rol: formData.rol,
        password: formData.password
      };
      
      await registrarEmpleado(datosRegistro);
      
      setEmailRegistrado(formData.email);
      setRegistroExitoso(true);
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrar empleado. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (registroExitoso) {
    return (
      <div className="register-container">
        {/* Header Principal */}
        <header className="main-header">
          <div className="header-content">
            <div className="logo-container">
              <img src={logo} alt="Bembos Logo" className="logo" />
            </div>
            <div className="header-right">
              <div className="user-info">
                <div className="user-text-container">
                  <span className="hello-text">¿Ya tienes cuenta?,</span>
                  <span className="login-text" onClick={() => navigate('/login')}>Iniciar sesión</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="register-main-content">
          <div className="register-wrapper">
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '3rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 2rem',
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
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                ¡Registro Exitoso!
              </h2>

              <p style={{
                color: '#666',
                fontSize: '1.1rem',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Tu cuenta ha sido creada exitosamente.
              </p>

              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <p style={{
                  color: '#333',
                  fontSize: '0.95rem',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  Correo registrado:
                </p>
                <p style={{
                  color: '#111788',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  wordBreak: 'break-word'
                }}>
                  {emailRegistrado}
                </p>
              </div>

              <p style={{
                color: '#666',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Ya puedes iniciar sesión con tu correo electrónico y contraseña.
              </p>

              <button
                onClick={() => navigate('/login')}
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
                  transition: 'background-color 0.3s',
                  marginBottom: '1rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0d1258'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#111788'}
              >
                Ir a Iniciar Sesión
              </button>

              <button
                onClick={() => {
                  setRegistroExitoso(false);
                  setEmailRegistrado('');
                  setFormData({
                    documentType: 'DNI',
                    document: '',
                    phone: '',
                    birthDate: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    lastName: '',
                    rol: 'cocinero'
                  });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 2rem',
                  backgroundColor: 'transparent',
                  color: '#111788',
                  border: '2px solid #111788',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#111788';
                  e.target.style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#111788';
                }}
              >
                Registrar otro empleado
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      {/* Header Principal */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-container">
            <img src={logo} alt="Bembos Logo" className="logo" />
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-text-container">
                <span className="hello-text">¿Ya tienes cuenta?,</span>
                <span className="login-text" onClick={() => navigate('/login')}>Iniciar sesión</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="register-main-content">
        <div className="register-wrapper">
          <div className="register-form-container">
            <h2>CREAR CUENTA</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-main-row">
                <div className="form-column-left">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nombre *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Ej. Juan"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Apellidos *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        placeholder="Ej. Pérez García"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-column-right">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="documentType">Tipo de Documento *</label>
                      <select
                        id="documentType"
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        required
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">CE</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="document">Documento *</label>
                      <input
                        type="text"
                        id="document"
                        name="document"
                        placeholder="Ej. 12345678"
                        value={formData.document}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-main-row form-main-row-email">
                <div className="form-column-left">
                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Ej. nombre@mail.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rol">Rol *</label>
                    <select
                      id="rol"
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
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
                </div>

                <div className="form-column-right">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Número de teléfono *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="Ej. 987654321"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="birthDate">Fecha de nacimiento *</label>
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-main-row form-main-row-password">
                <div className="form-column-left">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Contraseña *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          placeholder="Aa12345"
                          value={formData.password}
                          onChange={handleChange}
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

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          placeholder="Aa12345"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showConfirmPassword ? (
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
                  </div>
                </div>

                <div className="form-column-right">
                  <div className="form-group">
                    {error && (
                      <div style={{ 
                        color: '#f61422', 
                        fontSize: '0.9rem', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#ffe6e6',
                        borderRadius: '6px',
                        border: '1px solid #f61422'
                      }}>
                        {error}
                      </div>
                    )}
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Registrando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-image-container">
                <img src={formImage} alt="Bembos" className="form-image" />
              </div>

              <div className="form-actions">
                <a href="#back" className="back-link" onClick={() => navigate(-1)}>
                  &lt;&lt; Volver
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


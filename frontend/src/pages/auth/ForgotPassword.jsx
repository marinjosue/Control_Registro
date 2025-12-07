import React, { useState } from 'react';
import axios from 'axios';
import styles from './styles/ForgotPassword.module.css';
import { useNavigate } from 'react-router-dom';
import companyLogo from '../../assets/logo_healthy.png';

const ForgotPassword = () => {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { correo });
      setMensaje('Si el correo existe, se enviaron instrucciones para recuperar la contraseña.');
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
        err?.message ||
        'Error al solicitar recuperación de contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className={styles.forgotContainer}>
      <div className={styles.forgotCard}>
        <img src={companyLogo} alt="Logo" className={styles.forgotLogo} />
        <h2 className={styles.forgotTitle}>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit} className={styles.forgotForm}>
          <div>
            <label htmlFor="email" className={styles.forgotLabel}>Correo electrónico:</label>
            <input
              id="email"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              required
              className={styles.forgotInput}
              placeholder="Ingrese su correo"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className={styles.forgotButton}
              style={{ flex: 1 }}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.forgotButton}
              style={{
                background: '#e5e7eb',
                color: '#374151',
                fontWeight: 500,
                flex: 1
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
        {mensaje && <div className={styles.forgotSuccess}>{mensaje}</div>}
        {error && <div className={styles.forgotError}>{error}</div>}
      </div>
    </div>
  );
};

export default ForgotPassword;

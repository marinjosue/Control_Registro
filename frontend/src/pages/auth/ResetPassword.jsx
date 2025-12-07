import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './styles/ResetPassword.module.css';
import { Eye, EyeOff } from 'lucide-react';
import companyLogo from '../../assets/logo_healthy.png';

const ResetPassword = (props) => {
  const params = useParams();
  const token = props.token || params.token;
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`,
        { nuevaContrasena }
      );
      setMensaje('Contraseña restablecida correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
        err?.message ||
        'Error al restablecer la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.resetContainer}>
      <div className={styles.resetCard}>
        <img src={companyLogo} alt="Logo" className={styles.resetLogo} />
        <h2 className={styles.resetTitle}>Restablecer contraseña</h2>
        {mensaje && <div className={styles.resetSuccess}>{mensaje}</div>}
        {error && <div className={styles.resetError}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.resetForm}>
          <div>
            <label htmlFor="nueva-contrasena" className={styles.resetLabel}>
              Nueva contraseña:
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="nueva-contrasena"
                type={showPassword ? "text" : "password"}
                value={nuevaContrasena}
                onChange={e => setNuevaContrasena(e.target.value)}
                required
                className={`${styles.resetInput} ${styles.passwordInput}`}
                placeholder="Nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.togglePasswordBtn}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmar-contrasena" className={styles.resetLabel}>
              Confirmar contraseña:
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirmar-contrasena"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmarContrasena}
                onChange={e => setConfirmarContrasena(e.target.value)}
                required
                className={`${styles.resetInput} ${styles.passwordInput}`}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={styles.togglePasswordBtn}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.resetButton}
          >
            {loading ? 'Restableciendo...' : 'Restablecer'}
          </button>
        </form>
      </div>
    </div>
  );
};
ResetPassword.propTypes = {
  token: PropTypes.string
};

export default ResetPassword;


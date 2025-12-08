import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCitas } from '../../context/CitasContext';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import styles from './styles/LoginDoctor.module.css';

const LoginDoctor = () => {
  const navigate = useNavigate();
  const { loginDoctor } = useCitas();
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = loginDoctor(formData.usuario, formData.password);
      
      if (result.success) {
        navigate('/agenda/doctor/dashboard');
      } else {
        setError(result.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <i className="pi pi-user-md" style={{ fontSize: '3rem', color: '#6366f1' }}></i>
          <h1>Portal del Doctor</h1>
          <p>Ingrese sus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <Message severity="error" text={error} className={styles.errorMessage} />
          )}

          <div className={styles.formGroup}>
            <label htmlFor="usuario">Usuario</label>
            <InputText
              id="usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              placeholder="Ingrese su usuario"
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <Password
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingrese su contraseña"
              required
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              disabled={loading}
            />
          </div>

          <div className={styles.demoCredentials}>
            <p><strong>Credenciales de demo:</strong></p>
            <ul>
              <li>Usuario: <code>cmendez</code> | Contraseña: <code>doctor123</code></li>
              <li>Usuario: <code>mrodriguez</code> | Contraseña: <code>doctor123</code></li>
              <li>Usuario: <code>lfernandez</code> | Contraseña: <code>doctor123</code></li>
              <li>Usuario: <code>agomez</code> | Contraseña: <code>doctor123</code></li>
            </ul>
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              label="Volver"
              icon="pi pi-arrow-left"
              className="p-button-secondary"
              onClick={handleGoBack}
              disabled={loading}
            />
            <Button
              type="submit"
              label="Ingresar"
              icon="pi pi-sign-in"
              loading={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginDoctor;

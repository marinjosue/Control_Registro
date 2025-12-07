import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './styles/Login.module.css';
import companyLogo from '../../assets/logo_healthy.png'; 
import userIcon from '../../assets/user_icon.png'; 
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login, user } = useAuth();

    useEffect(() => {
        if (user) {
            // Redirigir según el rol del usuario
            if (user.rol === 'RH' || user.rol === 'ADMIN' || user.rol === 'ADMINISTRADOR') {
                navigate('/rh');
            } else {
                navigate('/');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usuario || !password) {
            setError('Por favor complete todos los campos');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await login({ usuario, password });
            // El AuthContext actualizará el usuario y redirigirá por el useEffect
        } catch (err) {
            if (err?.response?.status === 401 || err?.response?.status === 404) {
                setError('Usuario o contraseña incorrectos.');
            } else if (err?.response?.data?.mensaje) {
                setError(err.response.data.mensaje);
            } else {
                setError('Ocurrió un error inesperado. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.fbLoginWrapper}>
            <button 
                onClick={() => navigate('/')} 
                className={styles.backButton}
                aria-label="Volver al inicio"
            >
                ← Volver al inicio
            </button>
            
            <div className={styles.fbLeft}>
                <div className={styles.fbLogoText}>
                    <img src={companyLogo} alt="Logo de la empresa" className={styles.fbLogo} />
                    <h1 className={styles.fbTitle}>Sistema de Control de Asistencias</h1>
                    <p className={styles.fbDesc}>
                        Permite registrar las entradas y salidas del personal, calcular de forma precisa las horas efectivas de trabajo y optimizar la gestión del talento humano.
                    </p>
                </div>
            </div>
            <div className={styles.fbRight}>
                <div className={styles.loginCard}>
                    <img src={userIcon} alt="Usuario" className={styles.userIcon} />
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="usuario">Usuario o Email</label>
                            <input
                                type="text"
                                id="usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ingrese su usuario o correo electrónico"
                                required
                                className={styles.input}
                                autoComplete="username"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Contraseña</label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                    required
                                    className={`${styles.input} ${styles.passwordInput}`}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className={styles.togglePasswordBtn}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.loginButton}
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </button>
                        
                        <div className={styles.options}>
                            <a href="/forgot-password" className={styles.forgotPassword}>
                                ¿Olvidó su contraseña?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
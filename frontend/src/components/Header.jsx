import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../pages/principal/styles/Principal.module.css';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className={styles.header}>
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <h2>TODO EN ESTÉTICA</h2>
                    <p className={styles.logoSubtitle}>Exportación & Importación</p>
                </div>
                <ul className={styles.navMenu}>
                    <li><a href="/#inicio">Inicio</a></li>
                    <li><a href="/#productos">Productos</a></li>
                    <li><a href="/#servicios">Servicios Láser</a></li>
                    <li><a href="/#contacto">Contacto</a></li>
                </ul>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => navigate('/agenda/login-doctor')} className={styles.loginBtn}>
                        Acceso Médicos
                    </button>
                    <button onClick={() => navigate('/login')} className={styles.loginBtn}>
                        Acceso RH
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Header;

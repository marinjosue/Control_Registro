import React from 'react';
import styles from '../pages/principal/styles/Principal.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3>TODO EN ESTÉTICA</h3>
                        <p>Exportación & Importación</p>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Especialistas en aparatología láser profesional</p>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Enlaces</h4>
                        <ul>
                            <li><a href="/#inicio">Inicio</a></li>
                            <li><a href="/#productos">Productos</a></li>
                            <li><a href="/#servicios">Servicios Láser</a></li>
                            <li><a href="/#contacto">Contacto</a></li>
                        </ul>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Equipos Láser</h4>
                        <ul>
                            <li>Láser Diodo</li>
                            <li>Nd Yag</li>
                            <li>CO2 Fraccionado</li>
                            <li>IPL Luz Pulsada</li>
                            <li>Alta Gama</li>
                        </ul>
                    </div>

                    <div className={styles.footerSection}>
                        <h4>Síguenos</h4>
                        <div className={styles.socialLinks}>
                            <a href="#whatsapp">WhatsApp</a>
                            <a href="#instagram">Instagram</a>
                            <a href="#facebook">Facebook</a>
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; 2024 Todo en estética exportación & importación. Creado con Wix.com</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

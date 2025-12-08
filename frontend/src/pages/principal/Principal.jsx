import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/Principal.module.css';

const Principal = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.landingContainer}>
      {/* Header/Navigation */}
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <h2>TODO EN ESTÉTICA</h2>
            <p className={styles.logoSubtitle}>Exportación & Importación</p>
          </div>
          <ul className={styles.navMenu}>
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#servicios">Servicios Láser</a></li>
            <li><a href="#productos">Productos</a></li>
            <li><a href="#contacto">Contacto</a></li>
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

      {/* Hero Section */}
      <section className={styles.hero} id="inicio">
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Servicios Láser Profesionales</h1>
          <p className={styles.heroSubtitle}>
            Conoce nuestra línea de aparatología láser de alta gama
          </p>
          <div className={styles.heroButtons}>
            <button 
              onClick={() => navigate('/agenda')} 
              className={styles.btnPrimary}
            >
              Ver Disponibilidad de Doctores
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('servicios');
                element?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className={styles.btnSecondary}
            >
              Ver Servicios
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.services} id="servicios">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Servicios Láser</h2>
          <p className={styles.sectionSubtitle}>
            Contamos con una gama amplia de modelos: Láser Diodo, Nd Yag, CO2 Fraccionado, IPL Luz Pulsada
          </p>
          
          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>🔷</div>
              <h3>Triláser Diodo + Picosecond</h3>
              <div className={styles.features}>
                <p><strong>5 Sistemas de longitudes de onda:</strong></p>
                <ul>
                  <li>🟣 755nm Alejandrita</li>
                  <li>🟣 808nm Láser diodo</li>
                  <li>🟣 1064nm Nd Yag</li>
                  <li>🟣 532nm Picosegundo</li>
                </ul>
                <p>✓ Sistema de enfriamiento Alemán</p>
                <p>✓ 50 millones de disparos</p>
                <p>✓ Elimina vellos desde la raíz</p>
              </div>
            </div>
            
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>💎</div>
              <h3>Láser Diodo Trionda</h3>
              <div className={styles.features}>
                <p><strong>Tres longitudes de ondas:</strong></p>
                <ul>
                  <li>🟣 755nm alejandrita</li>
                  <li>🟣 808nm Láser diodo</li>
                  <li>🟣 1064nm Nd Yag</li>
                </ul>
                <p>✓ 3 cristales con diferentes longitudes</p>
                <p>✓ 50 millones de disparos</p>
                <p>✓ Sistema de enfriamiento</p>
                <p>✓ Con garantía y capacitación</p>
              </div>
            </div>
            
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>✨</div>
              <h3>Trionda Soprano + Nd Yag</h3>
              <div className={styles.features}>
                <p><strong>Tecnología de modelado de luz:</strong></p>
                <ul>
                  <li>808nm + 755nm + 1064nm</li>
                  <li>532nm + 755nm + 1064nm (Nd Yag)</li>
                </ul>
                <p>✓ Alto rendimiento</p>
                <p>✓ Depilación permanente</p>
                <p>✓ Eliminación de tatuajes</p>
                <p>✓ Rejuvenecimiento</p>
              </div>
            </div>
            
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>💫</div>
              <h3>Láser CO2 Fraccionado</h3>
              <div className={styles.features}>
                <p><strong>Tratamientos innovadores:</strong></p>
                <ul>
                  <li>Reconstrucción microvascular</li>
                  <li>Relajación vaginal</li>
                  <li>Rejuvenecimiento íntimo</li>
                  <li>Incontinencia urinaria</li>
                </ul>
                <p>✓ Sin necesidad de anestesia</p>
                <p>✓ Tratamiento indoloro</p>
                <p>✓ Solución precisa</p>
              </div>
            </div>
            
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>🌟</div>
              <h3>IPL Luz Pulsada + Nd Yag</h3>
              <div className={styles.features}>
                <p><strong>Múltiples aplicaciones:</strong></p>
                <ul>
                  <li>Eliminación de pigmentos</li>
                  <li>Depilación profesional</li>
                  <li>Tratamiento del acné</li>
                  <li>Rejuvenecimiento de la piel</li>
                  <li>Eliminación de tatuajes</li>
                </ul>
              </div>
            </div>
            
            <div className={styles.serviceCard}>
              <div className={styles.productImage}>👑</div>
              <h3>Aparatología de Alta Gama</h3>
              <div className={styles.features}>
                <p><strong>Equipos premium:</strong></p>
                <p>Disponible solo por encargo</p>
                <p>✓ Solicita tu catálogo</p>
                <p>✓ Asesoría personalizada</p>
                <p>✓ Importación directa</p>
                <p>✓ Garantía internacional</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles.about} id="productos">
        <div className={styles.container}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <h2>Aparatología Profesional</h2>
              <p>
                Especialistas en importación y exportación de equipos láser de alta tecnología 
                para tratamientos estéticos profesionales.
              </p>
              <ul className={styles.benefitsList}>
                <li>✓ Equipos de última generación</li>
                <li>✓ Importación directa</li>
                <li>✓ Garantía internacional</li>
                <li>✓ Capacitación incluida</li>
                <li>✓ Soporte técnico especializado</li>
                <li>✓ Asesoría personalizada</li>
              </ul>
              <button 
                onClick={() => navigate('/agenda')} 
                className={styles.btnAbout}
              >
                Consultar Disponibilidad
              </button>
            </div>
            <div className={styles.aboutImage}>
              <div className={styles.imagePlaceholder}>
                <span className={styles.placeholderIcon}>💎</span>
                <p className={styles.placeholderText}>Equipos Láser Profesionales</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contact} id="contacto">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Contáctanos</h2>
          <p className={styles.sectionSubtitle}>
            TODO EN ESTÉTICA EXPORTACIÓN & IMPORTACIÓN
          </p>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📍</div>
                <div>
                  <h4>Ubicación</h4>
                  <p>Ecuador</p>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📱</div>
                <div>
                  <h4>WhatsApp</h4>
                  <p>Contáctanos por WhatsApp</p>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>✉️</div>
                <div>
                  <h4>Email</h4>
                  <p>amayatododeestetica@gmail.com</p>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📋</div>
                <div>
                  <h4>Catálogo</h4>
                  <p>Solicita nuestro catálogo completo</p>
                </div>
              </div>
            </div>
            
            <div className={styles.contactCta}>
              <h3>¿Necesitas consultar disponibilidad?</h3>
              <p>Agenda una cita con nuestros especialistas y conoce toda nuestra línea de productos</p>
              <button 
                onClick={() => navigate('/agenda')} 
                className={styles.btnContact}
              >
                Ver Disponibilidad de Doctores
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#servicios">Servicios Láser</a></li>
                <li><a href="#productos">Productos</a></li>
                <li><a href="#contacto">Contacto</a></li>
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
    </div>
  );
};

export default Principal;

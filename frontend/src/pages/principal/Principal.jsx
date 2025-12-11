

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/Principal.module.css';
import products from '../../data/products.json';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Principal = () => {
  const navigate = useNavigate();

  const handleProductClick = (id) => {
    navigate(`/producto/${id}`);
  };

  return (
    <div className={styles.landingContainer}>
      {/* Header/Navigation */}
      <Header />

      {/* Hero Section */}
      <section className={styles.hero} id="inicio">
        <img src="/imagenes/inicio.png" alt="Hero Background" className={styles.heroBg} />
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h1 className={styles.ctaTitle}>Servicios Láser Profesionales</h1>
          <p className={styles.ctaSubtitle}>
            Conoce nuestra línea de aparatología láser de alta gama
          </p>
          <div className={styles.ctaButtons}>
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


      {/* Products Section */}
      <section className={styles.services} id="productos">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Nuestros Productos</h2>
          <p className={styles.sectionSubtitle}>
            Descubre nuestra gama de aparatología estética de alta calidad
          </p>
          <div className={styles.servicesGrid}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className={styles.services} id="servicios">
        <div className={styles.servicesGrid}>

          {/* Producto 1 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto 1.png" alt="Producto 1" />
            </div>
            <h3>3 en 1 Icon Mango IPL y ND YAG para Depilación</h3>
            <div className={styles.features}>
              <p><strong>Características principales:</strong></p>
              <ul>
                <li>Tecnología IPL avanzada</li>
                <li>Sistema ND YAG integrado</li>
                <li>3 funciones en 1 dispositivo</li>
              </ul>
              <p>✓ Depilación profesional efectiva</p>
              <p>✓ Tratamiento de todas las áreas</p>
              <p>✓ Resultados duraderos</p>
            </div>
          </div>

          {/* Producto 2 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto2.png" alt="Producto 2" />
            </div>
            <h3>Depilación Láser Nd Yag 2 en 1 Máquina</h3>
            <div className={styles.features}>
              <p><strong>Características principales:</strong></p>
              <ul>
                <li>Tecnología Nd Yag dual</li>
                <li>2 cabezales intercambiables</li>
                <li>Precisión en tratamientos</li>
              </ul>
              <p>✓ Depilación eficaz</p>
              <p>✓ Eliminación de tatuajes</p>
              <p>✓ Rejuvenecimiento de piel</p>
            </div>
          </div>

          {/* Producto 3 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto3.png" alt="Producto 3" />
            </div>
            <h3>Analizador Facial 3D para Análisis de Pigmentación y Arrugas</h3>
            <div className={styles.features}>
              <p><strong>Funciones avanzadas:</strong></p>
              <ul>
                <li>Análisis 3D en tiempo real</li>
                <li>Detección de pigmentación</li>
                <li>Evaluación de arrugas y líneas</li>
              </ul>
              <p>✓ Diagnóstico profesional</p>
              <p>✓ Reportes detallados</p>
              <p>✓ Seguimiento del tratamiento</p>
            </div>
          </div>

          {/* Producto 4 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto4.png" alt="Producto 4" />
            </div>
            <h3>Aparatología Hifu 7D Escritorio</h3>
            <div className={styles.features}>
              <p><strong>Características premium:</strong></p>
              <ul>
                <li>Tecnología Hifu última generación</li>
                <li>7 cartuchos intercambiables</li>
                <li>Pantalla táctil intuitiva</li>
              </ul>
              <p>✓ Levantamiento facial sin invasión</p>
              <p>✓ Rejuvenecimiento profundo</p>
              <p>✓ Resultados inmediatos</p>
            </div>
          </div>

          {/* Producto 5 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto5.png" alt="Producto 5" />
            </div>
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

          {/* Producto 6 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto6.png" alt="Producto 6" />
            </div>
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

          {/* Producto 7 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto7.png" alt="Producto 7" />
            </div>
            <h3>Máquina Masajeadora</h3>
            <div className={styles.features}>
              <p><strong>Incluye:</strong></p>
              <ul>
                <li>Cabezales intercambiables</li>
                <li>Accesorios completos</li>
                <li>Certificaciones internacionales</li>
              </ul>
              <p>✓ Uso profesional y estético</p>
            </div>
          </div>

          {/* Producto 8 */}
          <div className={styles.serviceCard}>
            <div className={styles.productImage}>
              <img src="/imagenes/producto8.png" alt="Producto 8" />
            </div>
            <h3>Hidrafacial 10 en 1</h3>
            <div className={styles.features}>
              <p><strong>Funciones principales:</strong></p>
              <ul>
                <li>Limpieza profunda</li>
                <li>Peeling ultrasónico</li>
                <li>RF facial</li>
                <li>Dermapen</li>
                <li>Vapor ozono</li>
              </ul>
              <p>✓ Equipo completo para centros estéticos</p>
            </div>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section className={styles.about} id="nosotros">
        <div className={styles.container}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutImage}>
              <img src="/imagenes/aparatologia.png" alt="Aparatología" className={styles.aboutImg} />
            </div>
            <div className={styles.aboutText}>
              <h2>APARATOLOGÍA</h2>
              <p className={styles.companyName}>AMAYA TODO EN ESTÉTICA</p>
              <p className={styles.aboutDescription}>
                Contamos con nuestro servicio de departamento Técnico especializado, realizamos mantenimiento correctivos y preventivos, reparamos toda aparatología en nuestro taller o a domicilio para centros estéticos
              </p>
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
      <Footer />
    </div>
  );
};

export default Principal;


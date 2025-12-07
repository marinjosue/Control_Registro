import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/Agenda.module.css';

const Agenda = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha: '',
    hora: '',
    motivo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se implementará la lógica para guardar la cita
    console.log('Datos de la cita:', formData);
    alert('Cita agendada con éxito. Nos pondremos en contacto contigo.');
    // Resetear formulario
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fecha: '',
      hora: '',
      motivo: ''
    });
  };

  return (
    <div className={styles.agendaContainer}>
      <div className={styles.agendaHeader}>
        <h1>Consultar Disponibilidad de Doctores</h1>
        <p>Completa el formulario para verificar disponibilidad y agendar tu cita</p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.agendaForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ingrese su nombre"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                placeholder="Ingrese su apellido"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                placeholder="0999999999"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fecha">Fecha Preferida *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hora">Hora Preferida *</label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="motivo">Motivo de la Consulta *</label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describa el tratamiento o servicio de su interés"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>
              Consultar Disponibilidad
            </button>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={() => navigate('/')}
            >
              Volver al Inicio
            </button>
          </div>
        </form>

        <div className={styles.infoSidebar}>
          <h3>Información de Contacto</h3>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📱</span>
            <div>
              <strong>WhatsApp</strong>
              <p>Contáctanos por WhatsApp</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>✉️</span>
            <div>
              <strong>Email</strong>
              <p>amayatododeestetica@gmail.com</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>🕐</span>
            <div>
              <strong>Horario de Atención</strong>
              <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>💎</span>
            <div>
              <strong>Especialidad</strong>
              <p>Equipos Láser Profesionales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;

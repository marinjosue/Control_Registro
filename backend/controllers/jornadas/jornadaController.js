const { Jornada } = require('../../models');

const crearJornada = async (req, res) => {
  const { nombre_jornada, hora_inicio, hora_fin, tipo_turno } = req.body;

  try {
    const jornada = await Jornada.create({
      nombre_jornada,
      hora_inicio,
      hora_fin,
      tipo_turno
    });

    res.status(201).json({ mensaje: 'Jornada creada con éxito', jornada });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear jornada', detalles: error.message });
  }
};

const obtenerJornadas = async (req, res) => {
  try {
    const jornadas = await Jornada.findAll();
    res.json(jornadas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener jornadas', detalles: error.message });
  }
};
const editarJornada = async (req, res) => {
  const { id } = req.params;
  const { nombre_jornada, hora_inicio, hora_fin, tipo_turno } = req.body;

  try {
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ mensaje: 'Jornada no encontrada' });
    }

    jornada.nombre_jornada = nombre_jornada || jornada.nombre_jornada;
    jornada.hora_inicio = hora_inicio || jornada.hora_inicio;
    jornada.hora_fin = hora_fin || jornada.hora_fin;
    jornada.tipo_turno = tipo_turno || jornada.tipo_turno;

    await jornada.save();
    res.json({ mensaje: 'Jornada actualizada con éxito', jornada });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar jornada', detalles: error.message });
  }
};

const eliminarJornada = async (req, res) => {
  const { id } = req.params;

  try {
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ mensaje: 'Jornada no encontrada' });
    }

    await jornada.destroy();
    res.json({ mensaje: 'Jornada eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar jornada', detalles: error.message });
  }
};



module.exports = {
  crearJornada,
  obtenerJornadas,
    editarJornada,
    eliminarJornada
};
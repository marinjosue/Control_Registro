const { Asistencia, Empleado, Area, HorarioEmpleado, Jornada, Cargo } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const NotificacionTabletService = require('../../services/tablet/notificacionTabletService');

//  CONFIGURACIÓN DE ALIMENTACIÓN
const CONFIGURACION_ALIMENTACION = {
    franjas: {
        DESAYUNO: { inicio: '10:30', fin: '11:30' },
        ALMUERZO: { inicio: '12:30', fin: '13:30' },
        MERIENDA: { inicio: '19:00', fin: '20:00' }
    },
    tiempoPermitido: 30
};

function obtenerComidaPorHoraEntrada(horaEntrada) {
    if (!horaEntrada) return null;
    
    const hora = parseInt(horaEntrada.split(':')[0]);
    
    if (hora < 7) {
        return 'DESAYUNO';
    } else if (hora < 12) {
        return 'ALMUERZO';
    } else {
        return 'MERIENDA';
    }
}

function estaEnFranjaPermitida(tipoComida, horaActual) {
    const franja = CONFIGURACION_ALIMENTACION.franjas[tipoComida];
    if (!franja) return false;
    
    const horaActualMinutos = convertirHoraAMinutos(horaActual);
    const inicioMinutos = convertirHoraAMinutos(franja.inicio);
    const finMinutos = convertirHoraAMinutos(franja.fin);
    
    return horaActualMinutos >= inicioMinutos && horaActualMinutos <= finMinutos;
}

function convertirHoraAMinutos(hora) {
    if (!hora || typeof hora !== 'string') {
        return 0;
    }
    
    const partes = hora.split(':');
    if (partes.length < 2) {
        return 0;
    }
    
    const h = parseInt(partes[0]) || 0;
    const m = parseInt(partes[1]) || 0;
    
    return h * 60 + m;
}

function calcularTiempoExcedido(horaSalida, horaRegreso) {
    const salidaMinutos = convertirHoraAMinutos(horaSalida);
    const regresoMinutos = convertirHoraAMinutos(horaRegreso);
    
    let tiempoTotal = regresoMinutos - salidaMinutos;
    if (tiempoTotal < 0) tiempoTotal += 24 * 60;
    
    const tiempoExcedido = tiempoTotal - CONFIGURACION_ALIMENTACION.tiempoPermitido;
    
    return {
        tiempoTotal,
        excedioTiempo: tiempoExcedido > 0,
        tiempoExcedido: tiempoExcedido > 0 ? tiempoExcedido : 0
    };
}

function calcularHoras(fechaEntrada, horaEntrada, fechaSalida, horaSalida) {
    try {
        const entradaCompleta = moment.tz(`${fechaEntrada} ${horaEntrada}`, 'YYYY-MM-DD HH:mm:ss', 'America/Bogota');
        const salidaCompleta = moment.tz(`${fechaSalida} ${horaSalida}`, 'YYYY-MM-DD HH:mm:ss', 'America/Bogota');

        const diferenciaMinutos = salidaCompleta.diff(entradaCompleta, 'minutes');
        const horasTrabajadas = diferenciaMinutos / 60;

        if (horasTrabajadas < 0) return 0;
        if (horasTrabajadas > 24) return 24;

        return parseFloat(horasTrabajadas.toFixed(1));
    } catch (error) {
        return 0;
    }
}

function validarPuntualidad(horaEsperada, horaActual) {
    const esperadaMinutos = convertirHoraAMinutos(horaEsperada);
    const actualMinutos = convertirHoraAMinutos(horaActual);
    const diferencia = actualMinutos - esperadaMinutos;

    if (diferencia > 0) {
        return {
            estado: 'tarde',
            detalle: `Llegó ${diferencia} minutos tarde`,
            minutosRetraso: diferencia
        };
    } else {
        return {
            estado: 'puntual',
            detalle: `Llegó puntual`,
            minutosRetraso: 0
        };
    }
}

const registrarAsistencia = async (req, res) => {
    try {
        const { id_empleado, observaciones, estado_puntualidad, detalle_puntualidad } = req.body;

        console.log('[TABLET_ASISTENCIA] 🔄 Iniciando registro para empleado:', id_empleado);

        if (!id_empleado) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de empleado requerido',
                error: 'DATOS_INCOMPLETOS'
            });
        }

        const empleado = await Empleado.findOne({
            where: { id_empleado: id_empleado, estado: 'Activo' },
            include: [
                { 
                    model: Area, 
                    as: 'Area',
                    attributes: ['id_area', 'nombre', 'descripcion'], 
                    required: false 
                },
                { 
                    model: Cargo, 
                    as: 'Cargo',
                    attributes: ['cargo'], 
                    required: false 
                }
            ]
        });

        if (!empleado) {
            return res.status(404).json({
                success: false,
                mensaje: 'Empleado no encontrado',
                error: 'EMPLEADO_NO_ENCONTRADO'
            });
        }

        const fechaLocal = moment.tz('America/Bogota').format('YYYY-MM-DD');
        
        console.log(`[TABLET_ASISTENCIA] 📅 Buscando horario para empleado ${id_empleado} en fecha: ${fechaLocal}`);
        
        let horarioHoy = await HorarioEmpleado.findOne({
            where: {
                id_empleado: id_empleado,
                fecha_horario: fechaLocal
            },
            include: [{
                model: Jornada,
                attributes: ['hora_inicio', 'hora_fin', 'nombre_jornada'],
                required: false
            }]
        });

        console.log(`[TABLET_ASISTENCIA] 🔍 Horario específico para hoy:`, horarioHoy ? 'ENCONTRADO' : 'NO ENCONTRADO');

        if (!horarioHoy) {
            console.log(`[TABLET_ASISTENCIA] 🔍 Buscando horario más reciente...`);
            
            horarioHoy = await HorarioEmpleado.findOne({
                where: {
                    id_empleado: id_empleado
                },
                include: [{
                    model: Jornada,
                    attributes: ['hora_inicio', 'hora_fin', 'nombre_jornada'],
                    required: false
                }],
                order: [['fecha_horario', 'DESC']]
            });

            console.log(`[TABLET_ASISTENCIA] 🔍 Horario más reciente encontrado:`, horarioHoy ? 'SÍ' : 'NO');
        }

        if (!horarioHoy) {
            console.log(`[TABLET_ASISTENCIA] ❌ Empleado ${empleado.nombres} sin ningún horario asignado`);
            return res.status(400).json({
                success: false,
                mensaje: `Sin horario asignado.\n${empleado.nombres} ${empleado.apellidos}\nContacte al administrador para asignar horario.`,
                error: 'SIN_HORARIO'
            });
        }

        let esDiaLibre = false;
        let mensajeAlerta = '';

        if (horarioHoy.es_dia_libre === 1 || horarioHoy.es_dia_libre === true) {
            esDiaLibre = true;
            mensajeAlerta = '⚠️ TRABAJANDO EN DÍA DE DESCANSO';
            console.log(`[TABLET_ASISTENCIA] ⚠️ Empleado ${empleado.nombres} registrándose en día libre`);
        }

        if (!esDiaLibre && !horarioHoy.Jornada) {
            console.log(`[TABLET_ASISTENCIA] ❌ Empleado ${empleado.nombres} sin jornada asignada`);
            return res.status(400).json({
                success: false,
                mensaje: `Sin jornada asignada.\n${empleado.nombres} ${empleado.apellidos}\nContacte al administrador para asignar jornada.`,
                error: 'SIN_JORNADA'
            });
        }

        let horaEntrada, horaSalida;
        
        if (esDiaLibre) {
            horaEntrada = '08:00:00';
            horaSalida = '17:00:00';
            console.log(`[TABLET_ASISTENCIA] 📅 Día libre - usando horario estándar: ${horaEntrada} - ${horaSalida}`);
        } else {
            horaEntrada = horarioHoy.Jornada.hora_inicio;
            horaSalida = horarioHoy.Jornada.hora_fin;
            console.log(`[TABLET_ASISTENCIA] 📅 Horario de jornada: ${horaEntrada} - ${horaSalida}`);
        }

        console.log(`[TABLET_ASISTENCIA] ✅ Empleado: ${empleado.nombres} ${empleado.apellidos}`);
        console.log(`[TABLET_ASISTENCIA] 📅 Horario final: ${horaEntrada} - ${horaSalida}`);
        console.log(`[TABLET_ASISTENCIA] 🏷️ Es día libre: ${esDiaLibre ? 'SÍ' : 'NO'}`);

        const horaLocal = moment.tz('America/Bogota').format('HH:mm:ss');

        console.log(`[TABLET_ASISTENCIA] 📅 Fecha/Hora local: ${fechaLocal} ${horaLocal}`);

        const registroExistente = await Asistencia.findOne({
            where: {
                id_empleado: id_empleado,
                fecha_entrada: fechaLocal
            }
        });

        const comidaAsignada = obtenerComidaPorHoraEntrada(horaEntrada);
        console.log(`[TABLET_ASISTENCIA] 🍽️ Comida asignada: ${comidaAsignada}`);

        let response;

        if (!registroExistente) {
            response = await procesarEntradaTrabajo(empleado, fechaLocal, horaLocal, horaEntrada, esDiaLibre, mensajeAlerta);
        } else if (registroExistente.hora_entrada && !registroExistente.hora_salida) {
            if (comidaAsignada) {
                const campoSalida = `hora_salida_${comidaAsignada.toLowerCase()}`;
                const campoEntrada = `hora_entrada_${comidaAsignada.toLowerCase()}`;
                const enFranja = estaEnFranjaPermitida(comidaAsignada, horaLocal);

                if (!registroExistente[campoSalida]) {
                    response = await procesarSalidaComida(registroExistente, empleado, fechaLocal, horaLocal, comidaAsignada, esDiaLibre, enFranja);
                } else if (!registroExistente[campoEntrada]) {
                    response = await procesarRegresoComida(registroExistente, empleado, fechaLocal, horaLocal, comidaAsignada, esDiaLibre, enFranja);
                } else {
                    response = await procesarSalidaTrabajo(registroExistente, empleado, fechaLocal, horaLocal, esDiaLibre);
                }
            } else {
                response = await procesarSalidaTrabajo(registroExistente, empleado, fechaLocal, horaLocal, esDiaLibre);
            }
        } else {
            response = {
                success: false,
                mensaje: `Ya completó todos los registros del día.\n${empleado.nombres} ${empleado.apellidos}`,
                error: 'REGISTRO_COMPLETO'
            };
        }

        if (response.success && req.app.locals.io) {
            const esRegistroNuevo = !registroExistente;
            
            const registroCompleto = await Asistencia.findByPk(
                response.asistencia.id_asistencia,
                {
                    include: [{
                        model: Empleado,
                        attributes: ['id_empleado', 'nombres', 'apellidos', 'cedula', 'sueldo', 'pin', 'id_area'],
                        include: [
                            {
                                model: Area,
                                as: 'Area',
                                attributes: ['id_area', 'nombre', 'descripcion'],
                                required: false
                            },
                            {
                                model: Cargo,
                                as: 'Cargo',
                                attributes: ['cargo'],
                                required: false
                            }
                        ]
                    }]
                }
            );

            if (registroCompleto) {
                req.app.locals.io.emit('asistencia_registrada', {
                    es_registro_nuevo: esRegistroNuevo,
                    asistencia: {
                        id_asistencia: registroCompleto.id_asistencia,
                        id_empleado: registroCompleto.id_empleado,
                        fecha_entrada: registroCompleto.fecha_entrada,
                        hora_entrada: registroCompleto.hora_entrada,
                        fecha_salida: registroCompleto.fecha_salida,
                        hora_salida: registroCompleto.hora_salida,
                        hora_entrada_desayuno: registroCompleto.hora_entrada_desayuno,
                        hora_salida_desayuno: registroCompleto.hora_salida_desayuno,
                        hora_entrada_almuerzo: registroCompleto.hora_entrada_almuerzo,
                        hora_salida_almuerzo: registroCompleto.hora_salida_almuerzo,
                        hora_entrada_merienda: registroCompleto.hora_entrada_merienda,
                        hora_salida_merienda: registroCompleto.hora_salida_merienda,
                        estado: registroCompleto.estado,
                        tipo_registro: registroCompleto.tipo_registro,
                        horas_trabajadas: registroCompleto.horas_trabajadas,
                        horas_normales: registroCompleto.horas_normales,
                        horas_25: registroCompleto.horas_25,
                        horas_50: registroCompleto.horas_50,
                        horas_100: registroCompleto.horas_100,
                        horas_feriado: registroCompleto.horas_feriado,
                        observaciones: registroCompleto.observaciones,
                        estado_salida: registroCompleto.estado_salida,
                        detalle_puntualidad: registroCompleto.detalle_puntualidad,
                        createdAt: registroCompleto.createdAt,
                        updatedAt: registroCompleto.updatedAt
                    },
                    empleado: {
                        id_empleado: registroCompleto.Empleado.id_empleado,
                        nombres: registroCompleto.Empleado.nombres,
                        apellidos: registroCompleto.Empleado.apellidos,
                        cedula: registroCompleto.Empleado.cedula,
                        sueldo: registroCompleto.Empleado.sueldo,
                        pin: registroCompleto.Empleado.pin,
                        id_area: registroCompleto.Empleado.id_area,
                        Area: {
                            id_area: registroCompleto.Empleado.Area?.id_area || null,
                            nombre: registroCompleto.Empleado.Area?.nombre || 'Sin área',
                            descripcion: registroCompleto.Empleado.Area?.descripcion || null
                        },
                        Cargo: {
                            cargo: registroCompleto.Empleado.Cargo?.cargo || 'Sin cargo'
                        }
                    },
                    timestamp: new Date()
                });
                
                console.log(`🔌 [WEBSOCKET] ${esRegistroNuevo ? 'REGISTRO NUEVO' : 'ACTUALIZACIÓN'} - ID: ${registroCompleto.id_asistencia}`);
                console.log(`🔌 [WEBSOCKET] Empleado: ${registroCompleto.Empleado.nombres} ${registroCompleto.Empleado.apellidos}`);
            }
        }

        console.log(`[TABLET_ASISTENCIA] 📋 Resultado: ${response.success ? 'ÉXITO' : 'ERROR'}`);
        
        return res.status(response.success ? 200 : 400).json(response);

    } catch (error) {
        console.error('[TABLET_ASISTENCIA] ❌ Error:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor',
            detalles: error.message
        });
    }
};

async function procesarEntradaTrabajo(empleado, fechaLocal, horaLocal, horaEntrada, esDiaLibre = false, mensajeAlerta = '') {
    console.log('[TABLET_ASISTENCIA] 🚪 Procesando entrada trabajo');

    const puntualidad = validarPuntualidad(horaEntrada, horaLocal);

    if (puntualidad.estado === 'tarde') {
        await NotificacionTabletService.crearNotificacionTardanza(
            empleado, 
            puntualidad.minutosRetraso, 
            horaEntrada, 
            horaLocal
        );
    }

    if (esDiaLibre) {
        await NotificacionTabletService.crearNotificacionDiaLibre(empleado, 'entrada');
    }

    let estadoTexto = puntualidad.estado === 'puntual' ? 'PUNTUAL' : 'TARDE';
    let icono = puntualidad.estado === 'puntual' ? '✅' : '⚠️';
    
    let mensaje = `${icono} ENTRADA ${estadoTexto}\n${empleado.nombres} ${empleado.apellidos}\n🕐 ${horaLocal}`;
    
    if (esDiaLibre) {
        mensaje = `${mensajeAlerta}\n${mensaje}`;
    }

    const asistencia = await Asistencia.create({
        id_empleado: empleado.id_empleado,
        fecha_entrada: fechaLocal,
        hora_entrada: horaLocal,
        tipo_registro: 'entrada',
        estado: puntualidad.estado,
        observaciones: `Entrada - ${puntualidad.estado}${esDiaLibre ? ' - DÍA LIBRE' : ''}`,
        detalle_puntualidad: puntualidad.detalle,
        horas_trabajadas: null
    });

    return {
        success: true,
        mensaje: mensaje,
        asistencia: {
            id_asistencia: asistencia.id_asistencia,
            tipo_registro: 'entrada',
            estado: asistencia.estado,
            hora_entrada: asistencia.hora_entrada,
            es_dia_libre: esDiaLibre
        },
        empleado: {
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            area: empleado.Area?.nombre || 'Sin área'
        },
        es_registro_alimentacion: false,
        alerta_dia_libre: esDiaLibre
    };
}

async function procesarSalidaTrabajo(registroExistente, empleado, fechaLocal, horaLocal, esDiaLibre = false) {
    console.log('[TABLET_ASISTENCIA] 🚪 Procesando salida trabajo');

    if (esDiaLibre) {
        await NotificacionTabletService.crearNotificacionDiaLibre(empleado, 'salida');
    }

    const horasCalculadas = calcularHoras(
        registroExistente.fecha_entrada,
        registroExistente.hora_entrada,
        fechaLocal,
        horaLocal
    );

    await registroExistente.update({
        fecha_salida: fechaLocal,
        hora_salida: horaLocal,
        tipo_registro: 'salida',
        estado_salida: 'normal',
        horas_trabajadas: horasCalculadas,
        observaciones: (registroExistente.observaciones || '') + ` | Salida: ${horaLocal} | Horas: ${horasCalculadas}h${esDiaLibre ? ' - DÍA LIBRE' : ''}`
    });

    let mensaje = `✅ SALIDA REGISTRADA\n${empleado.nombres} ${empleado.apellidos}\n🕐 Horas trabajadas: ${horasCalculadas}h`;
    
    if (esDiaLibre) {
        mensaje = `⚠️ TRABAJÓ EN DÍA DE DESCANSO\n${mensaje}`;
    }

    return {
        success: true,
        mensaje: mensaje,
        asistencia: {
            id_asistencia: registroExistente.id_asistencia,
            tipo_registro: 'salida',
            estado_salida: 'normal',
            hora_salida: horaLocal,
            horas_trabajadas: horasCalculadas,
            es_dia_libre: esDiaLibre
        },
        empleado: {
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            area: empleado.Area?.nombre || 'Sin área'
        },
        es_registro_alimentacion: false,
        alerta_dia_libre: esDiaLibre
    };
}

async function procesarSalidaComida(registroExistente, empleado, fechaLocal, horaLocal, tipoComida, esDiaLibre = false, enFranja = true) {
    console.log(`[TABLET_ASISTENCIA] 🍽️ Procesando salida a ${tipoComida} - En franja: ${enFranja}`);

    if (!enFranja) {
        const franja = CONFIGURACION_ALIMENTACION.franjas[tipoComida];
        await NotificacionTabletService.crearNotificacionFueraHorario(
            empleado, 
            tipoComida, 
            'salida', 
            franja, 
            horaLocal
        );
    }

    if (esDiaLibre) {
        await NotificacionTabletService.crearNotificacionDiaLibre(empleado, `salida_${tipoComida.toLowerCase()}`);
    }

    const campoSalida = `hora_salida_${tipoComida.toLowerCase()}`;

    const [hora, minutos] = horaLocal.split(':').map(Number);
    const tiempoLimite = new Date();
    tiempoLimite.setHours(hora, minutos + CONFIGURACION_ALIMENTACION.tiempoPermitido, 0, 0);
    const tiempoLimiteString = tiempoLimite.toTimeString().split(' ')[0].substring(0, 5);

    let estadoSalida, mensaje, alertaFueraHorario = false;
    
    if (enFranja) {
        estadoSalida = 'normal';
        mensaje = `🍽️ SALIDA ${tipoComida}\n${empleado.nombres} ${empleado.apellidos}\n⏱️ Regrese antes de las ${tiempoLimiteString}`;
    } else {
        estadoSalida = 'fuera_horario';
        alertaFueraHorario = true;
        
        const franja = CONFIGURACION_ALIMENTACION.franjas[tipoComida];
        mensaje = `⚠️ SALIDA ${tipoComida} FUERA DE HORARIO\n${empleado.nombres} ${empleado.apellidos}\n🕐 Horario: ${franja.inicio} - ${franja.fin}\n⏱️ Regrese antes de las ${tiempoLimiteString}`;
    }

    if (esDiaLibre) {
        mensaje = `⚠️ DÍA DE DESCANSO\n${mensaje}`;
    }

    const updateData = {
        [campoSalida]: horaLocal,
        observaciones: (registroExistente.observaciones || '') + 
            ` | Salida ${tipoComida}: ${horaLocal}${!enFranja ? ' (FUERA HORARIO)' : ''}${esDiaLibre ? ' - DÍA LIBRE' : ''}`
    };

    await registroExistente.update(updateData);

    return {
        success: true,
        mensaje: mensaje,
        asistencia: {
            id_asistencia: registroExistente.id_asistencia,
            tipo_registro: 'salida_comida',
            tipo_comida: tipoComida,
            hora_salida_comida: horaLocal,
            tiempo_limite: tiempoLimiteString,
            estado_salida: estadoSalida,
            en_franja_horaria: enFranja,
            es_dia_libre: esDiaLibre
        },
        empleado: {
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            area: empleado.Area?.nombre || 'Sin área'
        },
        es_registro_alimentacion: true,
        alerta_dia_libre: esDiaLibre,
        alerta_fuera_horario: alertaFueraHorario
    };
}

async function procesarRegresoComida(registroExistente, empleado, fechaLocal, horaLocal, tipoComida, esDiaLibre = false, enFranja = true) {
    console.log(`[TABLET_ASISTENCIA] 🏃 Procesando regreso de ${tipoComida} - En franja: ${enFranja}`);

    const campoSalida = `hora_salida_${tipoComida.toLowerCase()}`;
    const campoEntrada = `hora_entrada_${tipoComida.toLowerCase()}`;
    
    const horaSalidaComida = registroExistente[campoSalida];
    const tiempoInfo = calcularTiempoExcedido(horaSalidaComida, horaLocal);
    
    if (tiempoInfo.excedioTiempo) {
        await NotificacionTabletService.crearNotificacionTiempoExcedido(
            empleado,
            tipoComida,
            tiempoInfo,
            horaSalidaComida,
            horaLocal
        );
    }

    const salidaFueraHorario = registroExistente.observaciones && 
                              registroExistente.observaciones.includes('(FUERA HORARIO)');

    if (!enFranja || salidaFueraHorario) {
        const franja = CONFIGURACION_ALIMENTACION.franjas[tipoComida];
        await NotificacionTabletService.crearNotificacionFueraHorario(
            empleado, 
            tipoComida, 
            'regreso', 
            franja, 
            horaLocal
        );
    }

    if (esDiaLibre) {
        await NotificacionTabletService.crearNotificacionDiaLibre(empleado, `regreso_${tipoComida.toLowerCase()}`);
    }

    let estadoRegreso = 'normal';
    let mensajeBase = '';
    let alertaFueraHorario = false;

    if (!enFranja || salidaFueraHorario) {
        estadoRegreso = 'fuera_horario';
        alertaFueraHorario = true;
        
        if (tiempoInfo.excedioTiempo) {
            mensajeBase = `⚠️ REGRESO ${tipoComida} FUERA DE HORARIO\n${empleado.nombres} ${empleado.apellidos}\n⚠️ Excedió ${tiempoInfo.tiempoExcedido} min del tiempo permitido`;
        } else {
            mensajeBase = `⚠️ REGRESO ${tipoComida} FUERA DE HORARIO\n${empleado.nombres} ${empleado.apellidos}\n✅ Tiempo respetado (${tiempoInfo.tiempoTotal} min)`;
        }
    } else {
        if (tiempoInfo.excedioTiempo) {
            mensajeBase = `⚠️ REGRESO ${tipoComida}\n${empleado.nombres} ${empleado.apellidos}\n⚠️ Excedió ${tiempoInfo.tiempoExcedido} minutos`;
        } else {
            mensajeBase = `✅ REGRESO ${tipoComida}\n${empleado.nombres} ${empleado.apellidos}\n✅ Tiempo respetado (${tiempoInfo.tiempoTotal} min)`;
        }
    }

    let mensaje = esDiaLibre ? `⚠️ DÍA DE DESCANSO\n${mensajeBase}` : mensajeBase;

    const updateData = {
        [campoEntrada]: horaLocal,
        observaciones: (registroExistente.observaciones || '') + 
            ` | Regreso ${tipoComida}: ${horaLocal} (${tiempoInfo.tiempoTotal}min${tiempoInfo.excedioTiempo ? ` - Excedió ${tiempoInfo.tiempoExcedido}min` : ''})${!enFranja ? ' (FUERA HORARIO)' : ''}${esDiaLibre ? ' - DÍA LIBRE' : ''}`
    };

    await registroExistente.update(updateData);

    return {
        success: true,
        mensaje: mensaje,
        asistencia: {
            id_asistencia: registroExistente.id_asistencia,
            tipo_registro: 'regreso_comida',
            tipo_comida: tipoComida,
            hora_regreso_comida: horaLocal,
            tiempo_total_minutos: tiempoInfo.tiempoTotal,
            excedio_tiempo: tiempoInfo.excedioTiempo,
            tiempo_excedido_minutos: tiempoInfo.tiempoExcedido,
            estado_regreso: estadoRegreso,
            en_franja_horaria: enFranja,
            es_dia_libre: esDiaLibre
        },
        empleado: {
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            area: empleado.Area?.nombre || 'Sin área'
        },
        es_registro_alimentacion: true,
        alerta_dia_libre: esDiaLibre,
        alerta_fuera_horario: alertaFueraHorario
    };
}

const obtenerAsistenciasHoy = async (req, res) => {
    try {
        const fechaHoy = moment.tz('America/Bogota').format('YYYY-MM-DD');
        
        console.log(`[TABLET_ASISTENCIA] Consultando asistencias para: ${fechaHoy}`);

        const ultimoRegistro = await Asistencia.findOne({
            where: {
                [Op.or]: [
                    { fecha_entrada: fechaHoy },
                    { fecha_salida: fechaHoy }
                ]
            },
            include: [{
                model: Empleado,
                attributes: ['nombres', 'apellidos', 'cedula'],
                include: [{
                    model: Area,
                    attributes: ['nombre'],
                    required: false
                }]
            }],
            order: [['createdAt', 'DESC']],
            limit: 1
        });

        if (!ultimoRegistro) {
            return res.json({
                success: true,
                mensaje: 'Sin registros para hoy',
                ultimo_registro: null
            });
        }

        const response = {
            success: true,
            mensaje: 'Último registro obtenido',
            ultimo_registro: {
                id_asistencia: ultimoRegistro.id_asistencia,
                id_empleado: ultimoRegistro.id_empleado,
                fecha_entrada: ultimoRegistro.fecha_entrada,
                hora_entrada: ultimoRegistro.hora_entrada,
                fecha_salida: ultimoRegistro.fecha_salida,
                hora_salida: ultimoRegistro.hora_salida,
                tipo_registro: ultimoRegistro.tipo_registro,
                estado: ultimoRegistro.estado,
                estado_salida: ultimoRegistro.estado_salida || null,
                horas_trabajadas: ultimoRegistro.horas_trabajadas,
                hora_salida_desayuno: ultimoRegistro.hora_salida_desayuno,
                hora_entrada_desayuno: ultimoRegistro.hora_entrada_desayuno,
                hora_salida_almuerzo: ultimoRegistro.hora_salida_almuerzo,
                hora_entrada_almuerzo: ultimoRegistro.hora_entrada_almuerzo,
                hora_salida_merienda: ultimoRegistro.hora_salida_merienda,
                hora_entrada_merienda: ultimoRegistro.hora_entrada_merienda,
                observaciones: ultimoRegistro.observaciones
            },
            empleado: {
                nombres: ultimoRegistro.Empleado.nombres,
                apellidos: ultimoRegistro.Empleado.apellidos,
                cedula: ultimoRegistro.Empleado.cedula,
                area: ultimoRegistro.Empleado.Area?.nombre || null
            }
        };

        res.json(response);

    } catch (error) {
        console.error('[TABLET_ASISTENCIA] Error:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const obtenerEstadisticasHoy = async (req, res) => {
    try {
        const fechaHoy = moment.tz('America/Bogota').format('YYYY-MM-DD');
        
        console.log(`[TABLET_ASISTENCIA] Estadísticas para: ${fechaHoy}`);

        const totalEntradas = await Asistencia.count({
            where: {
                fecha_entrada: fechaHoy,
                hora_entrada: { [Op.ne]: null }
            }
        });

        const totalSalidas = await Asistencia.count({
            where: {
                [Op.or]: [
                    { fecha_salida: fechaHoy },
                    { fecha_entrada: fechaHoy }
                ],
                hora_salida: { [Op.ne]: null }
            }
        });

        const puntuales = await Asistencia.count({
            where: {
                fecha_entrada: fechaHoy,
                estado: 'puntual'
            }
        });

        const tardios = await Asistencia.count({
            where: {
                fecha_entrada: fechaHoy,
                estado: 'tarde'
            }
        });

        const registrosConHoras = await Asistencia.findAll({
            where: {
                [Op.or]: [
                    { fecha_entrada: fechaHoy },
                    { fecha_salida: fechaHoy }
                ],
                horas_trabajadas: { [Op.ne]: null }
            },
            attributes: ['horas_trabajadas']
        });

        const totalHorasHoy = registrosConHoras.reduce((total, registro) => {
            return total + (parseFloat(registro.horas_trabajadas) || 0);
        }, 0);

        res.json({
            success: true,
            fecha: fechaHoy,
            estadisticas: {
                total_entradas: totalEntradas,
                total_salidas: totalSalidas,
                puntuales: puntuales,
                tardios: tardios,
                total_horas_trabajadas: Math.round(totalHorasHoy * 10) / 10,
                promedio_horas_por_empleado: totalSalidas > 0 ? Math.round(totalHorasHoy / totalSalidas * 10) / 10 : 0
            }
        });

    } catch (error) {
        console.error('[TABLET_ASISTENCIA] Error:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

const obtenerUltimoRegistro = async (req, res) => {
    try {
        const { idEmpleado } = req.params;
        const fechaHoy = moment.tz('America/Bogota').format('YYYY-MM-DD');
        
        console.log(`[TABLET_ASISTENCIA] 📋 Consultando último registro empleado: ${idEmpleado} para fecha: ${fechaHoy}`);

        if (!idEmpleado) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de empleado requerido',
                error: 'PARAMETRO_FALTANTE'
            });
        }

        const ultimoRegistro = await Asistencia.findOne({
            where: {
                id_empleado: parseInt(idEmpleado),
                fecha_entrada: fechaHoy
            },
            include: [{
                model: Empleado,
                attributes: ['nombres', 'apellidos', 'cedula', 'pin'],
                include: [{
                    model: Area,
                    as: 'Area',
                    attributes: ['nombre'],
                    required: false
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        if (!ultimoRegistro) {
            return res.json({
                success: false,
                mensaje: 'Sin registros para hoy',
                ultimo_registro: null,
                empleado: null
            });
        }

        let siguienteAccion = 'entrada';
        let puedeRegistrarse = true;
        let mensajeEstado = '';

        if (ultimoRegistro.hora_entrada && !ultimoRegistro.hora_salida) {
            const comidaAsignada = obtenerComidaPorHoraEntrada(ultimoRegistro.hora_entrada);
            const horaActual = moment.tz('America/Bogota').format('HH:mm:ss');
            
            if (comidaAsignada) {
                const campoSalida = `hora_salida_${comidaAsignada.toLowerCase()}`;
                const campoEntrada = `hora_entrada_${comidaAsignada.toLowerCase()}`;
                
                if (!ultimoRegistro[campoSalida]) {
                    siguienteAccion = 'salida_comida';
                    mensajeEstado = `Puede ir a ${comidaAsignada}`;
                } else if (!ultimoRegistro[campoEntrada]) {
                    siguienteAccion = 'regreso_comida';
                    mensajeEstado = `Debe regresar de ${comidaAsignada}`;
                } else {
                    siguienteAccion = 'salida';
                    mensajeEstado = 'Puede registrar salida';
                }
            } else {
                siguienteAccion = 'salida';
                mensajeEstado = 'Puede registrar salida';
            }
        } else if (ultimoRegistro.hora_entrada && ultimoRegistro.hora_salida) {
            puedeRegistrarse = false;
            mensajeEstado = 'Ya completó todos los registros del día';
        }

        const response = {
            success: true,
            mensaje: 'Último registro obtenido exitosamente',
            ultimo_registro: {
                id_asistencia: ultimoRegistro.id_asistencia,
                id_empleado: ultimoRegistro.id_empleado,
                fecha_entrada: ultimoRegistro.fecha_entrada,
                hora_entrada: ultimoRegistro.hora_entrada,
                fecha_salida: ultimoRegistro.fecha_salida,
                hora_salida: ultimoRegistro.hora_salida,
                tipo_registro: ultimoRegistro.tipo_registro,
                estado: ultimoRegistro.estado,
                estado_salida: ultimoRegistro.estado_salida,
                horas_trabajadas: ultimoRegistro.horas_trabajadas,
                hora_salida_desayuno: ultimoRegistro.hora_salida_desayuno,
                hora_entrada_desayuno: ultimoRegistro.hora_entrada_desayuno,
                hora_salida_almuerzo: ultimoRegistro.hora_salida_almuerzo,
                hora_entrada_almuerzo: ultimoRegistro.hora_entrada_almuerzo,
                hora_salida_merienda: ultimoRegistro.hora_salida_merienda,
                hora_entrada_merienda: ultimoRegistro.hora_entrada_merienda,
                observaciones: ultimoRegistro.observaciones,
                siguiente_accion: siguienteAccion,
                puede_registrarse: puedeRegistrarse,
                mensaje_estado: mensajeEstado
            },
            empleado: {
                id_empleado: ultimoRegistro.Empleado.id_empleado,
                nombres: ultimoRegistro.Empleado.nombres,
                apellidos: ultimoRegistro.Empleado.apellidos,
                cedula: ultimoRegistro.Empleado.cedula,
                pin: ultimoRegistro.Empleado.pin,
                area: ultimoRegistro.Empleado.Area?.nombre || 'Sin área'
            }
        };

        res.json(response);

    } catch (error) {
        console.error('[TABLET_ASISTENCIA] ❌ Error obtenerUltimoRegistro:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor',
            error: error.message
        });
    }
};

module.exports = {
    registrarAsistencia,
    obtenerAsistenciasHoy,
    obtenerEstadisticasHoy,
    obtenerUltimoRegistro
};
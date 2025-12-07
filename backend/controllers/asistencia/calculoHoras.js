const { Jornada, Feriado, HorarioEmpleado, Asistencia } = require('../../models');
const { Op } = require('sequelize');

// Convierte HH:mm a minutos
function horaToMinutos(hora) {
    if (!hora || typeof hora !== 'string' || !hora.includes(':')) {
        throw new Error(`Hora inválida: "${hora}"`);
    }
    const partes = hora.split(':').map(Number);
    if (partes.length < 2 || isNaN(partes[0]) || isNaN(partes[1])) {
        throw new Error(`Hora inválida: "${hora}"`);
    }
    // Si hay segundos, ignóralos
    const [h, m] = partes;
    return h * 60 + m;
}

// Detecta si una fecha es feriado
async function esFeriado(fecha) {
    const feriado = await Feriado.findOne({ where: { fecha } });
    return !!feriado;
}

// Obtener el horario más reciente del empleado para una fecha
async function obtenerHorarioEmpleado(idEmpleado, fecha) {
    const horario = await HorarioEmpleado.findOne({
        where: {
            id_empleado: idEmpleado,
            fecha_horario: { [Op.lte]: fecha }
        },
        include: [{
            model: Jornada,
            required: true
        }],
        order: [
            ['fecha_horario', 'DESC'],
            ['createdAt', 'DESC'] // <-- Añade esta línea
        ]
    });

    return horario;
}

// Función para calcular el tiempo de descanso real por comidas
function calcularTiempoDescanso(asistencia) {
    let tiempoTotalDescanso = 0;

    // Verificar tiempo de desayuno
    if (
        typeof asistencia.hora_entrada_desayuno === 'string' && asistencia.hora_entrada_desayuno.includes(':') &&
        typeof asistencia.hora_salida_desayuno === 'string' && asistencia.hora_salida_desayuno.includes(':')
    ) {
        const inicioDesayuno = horaToMinutos(asistencia.hora_entrada_desayuno); // CAMBIO: entrada es inicio
        const finDesayuno = horaToMinutos(asistencia.hora_salida_desayuno);     // CAMBIO: salida es fin
        let tiempoDesayuno = finDesayuno - inicioDesayuno;
        if (tiempoDesayuno < 0) tiempoDesayuno = (24 * 60) + tiempoDesayuno;
        const tiempoComputado = Math.max(tiempoDesayuno, 30);
        tiempoTotalDescanso += tiempoComputado;
        console.log(`[CALCULO_HORAS] Tiempo desayuno: ${tiempoDesayuno} minutos (computado: ${tiempoComputado} minutos)`);
    }

    // Verificar tiempo de almuerzo (aplicar el mismo cambio)
    if (
        typeof asistencia.hora_entrada_almuerzo === 'string' && asistencia.hora_entrada_almuerzo.includes(':') &&
        typeof asistencia.hora_salida_almuerzo === 'string' && asistencia.hora_salida_almuerzo.includes(':')
    ) {
        const inicioAlmuerzo = horaToMinutos(asistencia.hora_entrada_almuerzo); // CAMBIO
        const finAlmuerzo = horaToMinutos(asistencia.hora_salida_almuerzo);     // CAMBIO
        let tiempoAlmuerzo = finAlmuerzo - inicioAlmuerzo;
        if (tiempoAlmuerzo < 0) tiempoAlmuerzo = (24 * 60) + tiempoAlmuerzo;
        tiempoTotalDescanso += tiempoAlmuerzo;
        console.log(`[CALCULO_HORAS] Tiempo almuerzo: ${tiempoAlmuerzo} minutos`);
    }

    // Verificar tiempo de merienda (aplicar el mismo cambio)
    if (
        typeof asistencia.hora_entrada_merienda === 'string' && asistencia.hora_entrada_merienda.includes(':') &&
        typeof asistencia.hora_salida_merienda === 'string' && asistencia.hora_salida_merienda.includes(':')
    ) {
        const inicioMerienda = horaToMinutos(asistencia.hora_entrada_merienda); // CAMBIO
        const finMerienda = horaToMinutos(asistencia.hora_salida_merienda);     // CAMBIO
        let tiempoMerienda = finMerienda - inicioMerienda;
        if (tiempoMerienda < 0) tiempoMerienda = (24 * 60) + tiempoMerienda;
        const tiempoComputado = Math.max(tiempoMerienda, 30);
        tiempoTotalDescanso += tiempoComputado;
        console.log(`[CALCULO_HORAS] Tiempo merienda: ${tiempoMerienda} minutos (computado: ${tiempoComputado} minutos)`);
    }

    // Si no hay registros de comidas, usar el valor predeterminado de 30 minutos
    if (tiempoTotalDescanso === 0) {
        tiempoTotalDescanso = 30;
        console.log(`[CALCULO_HORAS] No hay registros de comidas, usando tiempo predeterminado: ${tiempoTotalDescanso} minutos`);
    }

    return tiempoTotalDescanso;
}

async function calcularHoras(asistencia, jornada, fecha) {
    try {
        // Detectar feriado
        const feriado = await esFeriado(fecha);

        // Verificar si es día libre
        const horarioEmpleado = await HorarioEmpleado.findOne({
            where: {
                id_empleado: asistencia.id_empleado,
                fecha_horario: { [Op.lte]: fecha }
            },
            order: [
                ['fecha_horario', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        if (horarioEmpleado && horarioEmpleado.es_dia_libre == 1 ) {
            // Todas las horas son 100%
            const entradaRealMin = horaToMinutos(asistencia.hora_entrada);
            const salidaMin = horaToMinutos(asistencia.hora_salida);
            let minutosTrabajados;
            if (salidaMin >= entradaRealMin) {
                minutosTrabajados = salidaMin - entradaRealMin;
            } else {
                minutosTrabajados = (24 * 60 - entradaRealMin) + salidaMin;
            }
            const tiempoDescanso = calcularTiempoDescanso(asistencia);
            minutosTrabajados -= tiempoDescanso;
            if (minutosTrabajados < 0) minutosTrabajados = 0;
            const horas100 = Math.round((minutosTrabajados / 60) * 100) / 100;
            return {
                horas_trabajadas: horas100,
                horas_normales: 0,
                horas_25: 0,
                horas_50: 0,
                horas_100: horas100,
                horas_feriado: 0
            };
        }

        // Obtener tiempos de entrada y salida reales
        const entradaRealMin = horaToMinutos(asistencia.hora_entrada);
        const salidaMin = horaToMinutos(asistencia.hora_salida);
        
        // Validar que la jornada tenga hora_inicio y hora_fin
        if (!jornada.hora_inicio) {
            throw new Error(`La jornada no tiene hora_inicio definida`);
        }
        if (!jornada.hora_fin) {
            throw new Error(`La jornada no tiene hora_fin definida`);
        }
        
        // Obtener hora programada de entrada y salida
        const entradaProgramadaMin = horaToMinutos(jornada.hora_inicio);
        const salidaProgramadaMin = horaToMinutos(jornada.hora_fin);
        
        // AJUSTAR HORA DE ENTRADA SEGÚN LA REGLA:
        let entradaParaCalculoMin;
        if (entradaRealMin <= entradaProgramadaMin) {
            entradaParaCalculoMin = entradaProgramadaMin; // Usar hora programada
        } else {
            entradaParaCalculoMin = entradaRealMin; // Usar hora real (tardanza)
        }
        
        console.log(`[DEBUG] Entrada para cálculo: ${entradaParaCalculoMin} min`);
        console.log(`[DEBUG] Salida: ${salidaMin} min`);
        console.log(`[DEBUG] Salida programada: ${salidaProgramadaMin} min`);
        console.log(`[DEBUG] Tipo turno: ${jornada.tipo_turno}`);
        
        // Calcular minutos trabajados brutos
        let minutosTrabajados;
        if (salidaMin >= entradaParaCalculoMin) {
            minutosTrabajados = salidaMin - entradaParaCalculoMin;
        } else {
            minutosTrabajados = (24 * 60 - entradaParaCalculoMin) + salidaMin;
        }

        // Calcular tiempo total de descansos
        const tiempoDescanso = calcularTiempoDescanso(asistencia);
        
        // Restar tiempo de descanso
        minutosTrabajados -= tiempoDescanso;
        if (minutosTrabajados < 0) minutosTrabajados = 0;

        // Si es feriado, todas las horas son de feriado
        if (feriado) {
            const horasTrabajadas = Math.round(minutosTrabajados / 60 * 100) / 100;
            return {
                horas_trabajadas: horasTrabajadas,
                horas_normales: 0,
                horas_25: 0,
                horas_50: 0,
                horas_100: 0,
                horas_feriado: horasTrabajadas
            };
        }

        // Inicializar contadores
        let horas_normales = 0;
        let horas_25 = 0;
        let horas_50 = 0;
        let horas_100 = 0;

        // Definir límites según tipo de turno
        const limite24h = 24 * 60; // 24:00 en minutos (1440)
        const limite19h = 19 * 60; // 19:00 en minutos (1140)
        
        let minutosRestantes = minutosTrabajados;
        let tiempoActual = entradaParaCalculoMin;

        // Ajustar tiempo actual si la entrada es después de la hora programada
        if (jornada.tipo_turno === 'Matutino') {
            // TURNO MATUTINO:
            // - Horas normales: hasta hora_fin de jornada (máximo 8 horas)
            // - 50%: desde hora_fin hasta 24:00
            // - 100%: después de 24:00

            // 1. Calcular horas normales (hasta la hora de salida programada o 8 horas máximo)
            const finJornadaMin = salidaProgramadaMin;
            const horasNormalesMaximas = 8 * 60; // 480 minutos
            
            if (tiempoActual < finJornadaMin && minutosRestantes > 0) {
                const minutosHastaSalidaProgramada = finJornadaMin - tiempoActual;
                const minutosNormales = Math.min(minutosHastaSalidaProgramada, minutosRestantes, horasNormalesMaximas);
                
                horas_normales = minutosNormales / 60;
                minutosRestantes -= minutosNormales;
                tiempoActual += minutosNormales;
            
            }

            // 2. 50% desde hora_fin hasta 24:00 (para el tiempo restante después de jornada)
            if (minutosRestantes > 0 && tiempoActual <= limite24h) {
                // Calcular cuánto tiempo puede ir a 50% (hasta 24:00)
                const minutosMaximosPara50 = limite24h - Math.max(tiempoActual, finJornadaMin);
                const minutos50 = Math.min(minutosMaximosPara50, minutosRestantes);
                
                if (minutos50 > 0) {
                    horas_50 = minutos50 / 60;
                    minutosRestantes -= minutos50;
                    tiempoActual += minutos50;
                    
                }
            }

            // 3. 100% después de 24:00
            if (minutosRestantes > 0) {
                horas_100 = minutosRestantes / 60;
                console.log(`[DEBUG] Matutino - Horas 100%: ${horas_100} (${minutosRestantes} min)`);
            }

        } else if (jornada.tipo_turno === 'Vespertino') {
            // TURNO VESPERTINO:
            // - Horas normales: desde entrada hasta 19:00
            // - 25%: desde 19:00 hasta completar jornada (hora_fin)
            // - 50%: desde hora_fin hasta 24:00
            // - 100%: después de 24:00

            // 1. Horas normales hasta 19:00
            if (tiempoActual < limite19h && minutosRestantes > 0) {
                const minutosHasta19 = limite19h - tiempoActual;
                const minutosNormales = Math.min(minutosHasta19, minutosRestantes);
                
                horas_normales = minutosNormales / 60;
                minutosRestantes -= minutosNormales;
                tiempoActual += minutosNormales;
                
                console.log(`[DEBUG] Vespertino - Horas normales: ${horas_normales} (${minutosNormales} min)`);
            }

            // 2. 25% desde 19:00 hasta hora_fin (completar jornada)
            const finJornadaMin = salidaProgramadaMin;
            if (tiempoActual >= limite19h && tiempoActual < finJornadaMin && minutosRestantes > 0) {
                const minutosHastaFinJornada = finJornadaMin - tiempoActual;
                const minutos25 = Math.min(minutosHastaFinJornada, minutosRestantes);
                
                horas_25 = minutos25 / 60;
                minutosRestantes -= minutos25;
                tiempoActual += minutos25;
                
                console.log(`[DEBUG] Vespertino - Horas 25%: ${horas_25} (${minutos25} min)`);
            }

            // 3. 50% desde hora_fin hasta 24:00
            if (tiempoActual >= finJornadaMin && tiempoActual < limite24h && minutosRestantes > 0) {
                const minutosHasta24 = limite24h - tiempoActual;
                const minutos50 = Math.min(minutosHasta24, minutosRestantes);
                
                horas_50 = minutos50 / 60;
                minutosRestantes -= minutos50;
                tiempoActual += minutos50;
                
                console.log(`[DEBUG] Vespertino - Horas 50%: ${horas_50} (${minutos50} min)`);
            }

            // 4. 100% después de 24:00
            if (minutosRestantes > 0) {
                horas_100 = minutosRestantes / 60;
                console.log(`[DEBUG] Vespertino - Horas 100%: ${horas_100} (${minutosRestantes} min)`);
            }
        }

        // Redondear a 2 decimales
        horas_normales = Math.round(horas_normales * 100) / 100;
        horas_25 = Math.round(horas_25 * 100) / 100;
        horas_50 = Math.round(horas_50 * 100) / 100;
        horas_100 = Math.round(horas_100 * 100) / 100;

        const horasTrabajadas = horas_normales + horas_25 + horas_50 + horas_100;

        const resultado = {
            horas_trabajadas: Math.round(horasTrabajadas * 100) / 100,
            horas_normales,
            horas_25,
            horas_50,
            horas_100,
            horas_feriado: 0
        };

        console.log(`[DEBUG] Resultado final:`, resultado);
        return resultado;

    } catch (error) {
        console.error('[CALCULO_HORAS] Error en calcularHoras:', error);
        throw error;
    }
}

// Función principal que maneja posibles cambios de jornada
async function calcularHorasCompletas(asistencia, opciones = {}) {
    const { id_empleado, fecha_entrada, fecha_salida } = asistencia;
    const { calcularExtrasAdministrativo = false, empleadosAdministrativos = [] } = opciones;

    // Obtener el horario del empleado para la fecha de entrada
    const horarioEntrada = await obtenerHorarioEmpleado(id_empleado, fecha_entrada);

    // Verificar si es empleado administrativo (por ID o área)
    const esAdministrativo = empleadosAdministrativos.includes(id_empleado) || 
                           (asistencia.area && asistencia.area.toUpperCase() === 'ADMINISTRACION');

    // ADMINISTRATIVO SIN HORARIO O ADMINISTRATIVO CON HORARIO PERO CON FLAG ACTIVO
    if (!horarioEntrada || (esAdministrativo && calcularExtrasAdministrativo)) {
        // Detectar feriado o descanso
        const feriado = await esFeriado(fecha_entrada);
        if (feriado || asistencia.es_dia_libre === 1) {
            // Todas las horas al 100%
            const entradaMin = horaToMinutos(asistencia.hora_entrada);
            const salidaMin = horaToMinutos(asistencia.hora_salida);
            let minutosTrabajados = salidaMin >= entradaMin
                ? salidaMin - entradaMin
                : (24 * 60 - entradaMin) + salidaMin;
            const tiempoDescanso = calcularTiempoDescanso(asistencia);
            minutosTrabajados -= tiempoDescanso;
            if (minutosTrabajados < 0) minutosTrabajados = 0;
            const horas100 = Math.round((minutosTrabajados / 60) * 100) / 100;
            return {
                horas_trabajadas: horas100,
                horas_normales: 0,
                horas_25: 0,
                horas_50: 0,
                horas_100: horas100,
                horas_feriado: feriado ? horas100 : 0
            };
        }

        // Calcular tiempo trabajado total
        const entradaMin = horaToMinutos(asistencia.hora_entrada);
        const salidaMin = horaToMinutos(asistencia.hora_salida);
        let minutosTrabajados = salidaMin >= entradaMin
            ? salidaMin - entradaMin
            : (24 * 60 - entradaMin) + salidaMin;
        
        // Restar tiempo de descanso (almuerzo, etc.)
        const tiempoDescanso = calcularTiempoDescanso(asistencia);
        minutosTrabajados -= tiempoDescanso;
        if (minutosTrabajados < 0) minutosTrabajados = 0;

        console.log(`[CALCULO_HORAS] Empleado ${id_empleado} - Administrativo: ${esAdministrativo}, Calcular extras: ${calcularExtrasAdministrativo}`);
        console.log(`[CALCULO_HORAS] Minutos trabajados después de descansos: ${minutosTrabajados}`);

        // Si NO se calculan extras: todo a horas normales
        if (!calcularExtrasAdministrativo || !esAdministrativo) {
            const horasNormales = Math.round((minutosTrabajados / 60) * 100) / 100;
            console.log(`[CALCULO_HORAS] Enviando todo a horas normales: ${horasNormales}`);
            return {
                horas_trabajadas: horasNormales,
                horas_normales: horasNormales,
                horas_25: 0,
                horas_50: 0,
                horas_100: 0,
                horas_feriado: 0
            };
        }

        // Si SÍ se calculan extras: aplicar lógica de turno matutino
        // Primeras 8 horas normales, resto como 50% (hasta medianoche), luego 100%
        console.log(`[CALCULO_HORAS] Calculando extras para administrativo`);
        const limite24h = 24 * 60; // 1440 minutos
        let minutosRestantes = minutosTrabajados;
        let horas_normales = 0;
        let horas_50 = 0;
        let horas_100 = 0;

        // 1. Primeras 8 horas como normales
        const minutosNormalesMaximos = 8 * 60; // 480 minutos
        const minutosNormales = Math.min(minutosRestantes, minutosNormalesMaximos);
        horas_normales = minutosNormales / 60;
        minutosRestantes -= minutosNormales;

        console.log(`[CALCULO_HORAS] Horas normales: ${horas_normales} (${minutosNormales} min)`);
        console.log(`[CALCULO_HORAS] Minutos restantes para extras: ${minutosRestantes}`);

        // 2. Resto como 50% (simulando comportamiento matutino)
        if (minutosRestantes > 0) {
            // Para administrativos, todo el tiempo extra se considera como 50%
            // ya que no tenemos horario específico para calcular hasta medianoche
            horas_50 = minutosRestantes / 60;
            console.log(`[CALCULO_HORAS] Horas 50%: ${horas_50} (${minutosRestantes} min)`);
        }

        // Redondear a 2 decimales
        horas_normales = Math.round(horas_normales * 100) / 100;
        horas_50 = Math.round(horas_50 * 100) / 100;
        horas_100 = Math.round(horas_100 * 100) / 100;

        const resultado = {
            horas_trabajadas: horas_normales + horas_50 + horas_100,
            horas_normales: horas_normales,
            horas_25: 0,
            horas_50: horas_50,
            horas_100: horas_100,
            horas_feriado: 0
        };

        console.log(`[CALCULO_HORAS] Resultado administrativo:`, resultado);
        return resultado;
    }

    // Si la fecha de entrada y salida son diferentes, verificar si hay cambio de horario
    if (fecha_entrada !== fecha_salida) {
        const horarioSalida = await obtenerHorarioEmpleado(id_empleado, fecha_salida);

        if (!horarioSalida || !horarioSalida.Jornada) {
            throw new Error(`El empleado ${id_empleado} no tiene horario asignado para la fecha ${fecha_salida}`);
        }

        // Si hay diferentes horarios, dividir el cálculo
        if (horarioEntrada?.id_jornada !== horarioSalida?.id_jornada) {
            // Calcular hasta medianoche del primer día
            const asistenciaParte1 = {
                ...asistencia,
                hora_salida: '23:59'
            };

            const resultadoParte1 = await calcularHoras(
                asistenciaParte1,
                horarioEntrada.Jornada,
                fecha_entrada
            );

            // Calcular desde medianoche hasta la salida
            const asistenciaParte2 = {
                ...asistencia,
                hora_entrada: '00:00'
            };

            const resultadoParte2 = await calcularHoras(
                asistenciaParte2,
                horarioSalida.Jornada,
                fecha_salida
            );

            // Sumar los resultados
            return {
                horas_trabajadas: resultadoParte1.horas_trabajadas + resultadoParte2.horas_trabajadas,
                horas_normales: resultadoParte1.horas_normales + resultadoParte2.horas_normales,
                horas_25: resultadoParte1.horas_25 + resultadoParte2.horas_25,
                horas_50: resultadoParte1.horas_50 + resultadoParte2.horas_50,
                horas_100: resultadoParte1.horas_100 + resultadoParte2.horas_100,
                horas_feriado: resultadoParte1.horas_feriado + resultadoParte2.horas_feriado
            };
        }
    }

    // Si es el mismo horario o mismo día, calcular normalmente
    return await calcularHoras(asistencia, horarioEntrada.Jornada, fecha_entrada);
}

// Utilidad para sumar minutos a una hora en formato HH:mm:ss
function sumarMinutosAHora(hora, minutosASumar) {
    const [h, m, s] = hora.split(':').map(Number);
    let totalMin = h * 60 + m + minutosASumar;
    let horas = Math.floor(totalMin / 60) % 24;
    let minutos = totalMin % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${(s || 0).toString().padStart(2, '0')}`;
}

/**
 * Función para calcular y actualizar horas de múltiples asistencias
 * @param {Array} asistencias - Lista de registros de asistencia
 * @returns {Object} - Resultado del proceso con contadores y detalles
 */

async function calcularYActualizarHoras(asistencias, forzarRecalculo = false, opciones = {}) {
    const resultado = {
        total: asistencias.length,
        procesados: 0,
        omitidos: 0,
        asistenciasProcesadas: [],
        asistenciasOmitidas: [],
        mensaje: ""
    };

    console.log(`[CALCULO_HORAS] Iniciando cálculo para ${asistencias.length} asistencias`);

    // Importa los modelos solo si es necesario (para evitar ciclos)
    const { Empleado, Area } = require('../../models');

    for (const asistenciaInput of asistencias) {
        try {
            // Buscar la instancia real en la base de datos
            const asistencia = await Asistencia.findByPk(
                asistenciaInput.id_asistencia || asistenciaInput
            );

            // Obtener el área del empleado y asignarla a asistencia.area
            if (asistencia && asistencia.id_empleado) {
                const empleado = await Empleado.findByPk(asistencia.id_empleado, {
                    include: [{ model: Area }]
                });
                if (empleado && empleado.Area && empleado.Area.nombre) {
                    asistencia.area = empleado.Area.nombre;
                }
            }

            console.log('[DEBUG asistencia]', asistencia && asistencia.toJSON ? asistencia.toJSON() : asistencia);
            
            if (!asistencia) {
                resultado.omitidos++;
                resultado.asistenciasOmitidas.push({
                    id_asistencia: asistenciaInput.id_asistencia || asistenciaInput,
                    mensaje: "No encontrada en la base de datos"
                });
                continue;
            }

            // Verificar que tenga hora de entrada y salida válidas
            if (
                !asistencia.hora_entrada ||
                !asistencia.hora_salida ||
                typeof asistencia.hora_entrada !== 'string' ||
                typeof asistencia.hora_salida !== 'string' ||
                !asistencia.hora_entrada.includes(':') ||
                !asistencia.hora_salida.includes(':')
            ) {
                resultado.omitidos++;
                resultado.asistenciasOmitidas.push({
                    id_asistencia: asistencia.id_asistencia,
                    fecha_entrada: asistencia.fecha_entrada,
                    hora_entrada: asistencia.hora_entrada,
                    hora_salida: asistencia.hora_salida,
                    mensaje: "Faltan datos de entrada o salida válidos"
                });
                continue;
            }

            // Calcular horas (siempre procesar, no validar valores previos)
            const calculoHoras = await calcularHorasCompletas(asistencia, opciones);

            await asistencia.update({
                horas_normales: calculoHoras.horas_normales,
                horas_25: calculoHoras.horas_25,
                horas_50: calculoHoras.horas_50,
                horas_100: calculoHoras.horas_100,
                horas_feriado: calculoHoras.horas_feriado
            });

            resultado.procesados++;
            resultado.asistenciasProcesadas.push({
                id_asistencia: asistencia.id_asistencia,
                fecha_entrada: asistencia.fecha_entrada,
                hora_entrada: asistencia.hora_entrada,
                hora_salida: asistencia.hora_salida,
                calculoHoras
            });

            console.log(`[CALCULO_HORAS] ✅ Procesado: ${asistencia.id_asistencia}`);

        } catch (error) {
            console.error(`[CALCULO_HORAS] Error procesando asistencia:`, error);
            resultado.omitidos++;
            resultado.asistenciasOmitidas.push({
                id_asistencia: asistenciaInput.id_asistencia || asistenciaInput,
                error: error.message
            });
        }
    }

    resultado.mensaje = `Procesados ${resultado.procesados}/${resultado.total} registros. Omitidos: ${resultado.omitidos}`;
    
    console.log(`[CALCULO_HORAS] Finalizado: ${resultado.mensaje}`);
    
    return resultado;
} 
module.exports = {
    calcularHoras,
    calcularHorasCompletas,
    calcularYActualizarHoras
};
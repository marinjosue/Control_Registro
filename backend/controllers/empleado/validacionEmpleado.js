function validarCedula(cedula) {
    // Solo números, longitud 10
    if (!/^\d{10}$/.test(cedula)) return false;

    // Validación de provincia (primeros dos dígitos entre 01 y 24)
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    // Validación de dígito verificador
    const digitos = cedula.split('').map(Number);
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let valor = digitos[i];
        if (i % 2 === 0) {
            valor *= 2;
            if (valor > 9) valor -= 9;
        }
        suma += valor;
    }
    const verificador = (10 - (suma % 10)) % 10;
    return verificador === digitos[9];
}

function validarNombreOApellido(valor) {
    // Solo letras y espacios, sin números
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor);
}



function validarCorreo(correo) {
    // Formato de correo básico
    return /^[^\d][\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(correo);
}


function validarSueldo(sueldo) {
    // Solo números (puede ser decimal)
    return /^\d+(\.\d{1,2})?$/.test(String(sueldo));
}

module.exports = {
    validarCedula,
    validarNombreOApellido,
    validarCorreo,
    validarSueldo
};

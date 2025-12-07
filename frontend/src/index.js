// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import './pages/auth/styles/ForgotPassword.module.css';
import './pages/auth/styles/ResetPassword.module.css';
import './pages/auth/styles/Login.module.css';
import './styles/variables.css';
import './styles/modalStyles.css';
import { PrimeReactProvider, addLocale, locale } from 'primereact/api';

// Configuración de localización en español
addLocale('es', {
    firstDayOfWeek: 1,
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    today: 'Hoy',
    clear: 'Limpiar',
    dateFormat: 'dd/mm/yy',
    weekHeader: 'Sem',
    // ConfirmDialog translations
    accept: 'Sí',
    reject: 'No',
    choose: 'Elegir',
    upload: 'Subir',
    cancel: 'Cancelar',
    // Texto para componentes
    startsWith: 'Comienza con',
    contains: 'Contiene',
    notContains: 'No contiene',
    endsWith: 'Termina con',
    equals: 'Igual a',
    notEquals: 'No igual a',
    noFilter: 'Sin filtro',
    lt: 'Menor que',
    lte: 'Menor o igual que',
    gt: 'Mayor que',
    gte: 'Mayor o igual que',
    is: 'Es',
    isNot: 'No es',
    before: 'Antes',
    after: 'Después',
    dateIs: 'Fecha es',
    dateIsNot: 'Fecha no es',
    dateBefore: 'Fecha antes',
    dateAfter: 'Fecha después',
    custom: 'Personalizado',
    apply: 'Aplicar',
    matchAll: 'Coincidir todo',
    matchAny: 'Coincidir cualquiera',
    addRule: 'Agregar regla',
    removeRule: 'Eliminar regla',
    pending: 'Pendiente',
    fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    weak: 'Débil',
    medium: 'Medio',
    strong: 'Fuerte',
    passwordPrompt: 'Ingrese una contraseña',
    emptyFilterMessage: 'No se encontraron resultados',
    emptyMessage: 'No hay opciones disponibles',
    aria: {
        trueLabel: 'Verdadero',
        falseLabel: 'Falso',
        nullLabel: 'No seleccionado',
        star: '1 estrella',
        stars: '{star} estrellas',
        selectAll: 'Todos los elementos seleccionados',
        unselectAll: 'Todos los elementos deseleccionados',
        close: 'Cerrar',
        previous: 'Anterior',
        next: 'Siguiente',
        navigation: 'Navegación',
        scrollTop: 'Ir arriba',
        moveTop: 'Mover arriba',
        moveUp: 'Mover hacia arriba',
        moveDown: 'Mover hacia abajo',
        moveBottom: 'Mover abajo',
        moveToTarget: 'Mover al objetivo',
        moveToSource: 'Mover al origen',
        moveAllToTarget: 'Mover todo al objetivo',
        moveAllToSource: 'Mover todo al origen',
        pageLabel: 'Página {page}',
        firstPageLabel: 'Primera página',
        lastPageLabel: 'Última página',
        nextPageLabel: 'Página siguiente',
        previousPageLabel: 'Página anterior',
        rowsPerPageLabel: 'Filas por página',
        jumpToPageDropdownLabel: 'Ir a la página desplegable',
        jumpToPageInputLabel: 'Ir a la página de entrada',
        selectRow: 'Fila seleccionada',
        unselectRow: 'Fila deseleccionada',
        expandRow: 'Fila expandida',
        collapseRow: 'Fila contraída',
        showFilterMenu: 'Mostrar menú de filtros',
        hideFilterMenu: 'Ocultar menú de filtros',
        filterOperator: 'Operador de filtro',
        filterConstraint: 'Restricción de filtro',
        editRow: 'Editar fila',
        saveEdit: 'Guardar edición',
        cancelEdit: 'Cancelar edición',
        listView: 'Vista de lista',
        gridView: 'Vista de cuadrícula',
        slide: 'Diapositiva',
        slideNumber: '{slideNumber}',
        zoomImage: 'Ampliar imagen',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        rotateRight: 'Rotar a la derecha',
        rotateLeft: 'Rotar a la izquierda'
    }
});

// Establecer el idioma por defecto
locale('es');

// Configuración de PrimeReact
const primeReactConfig = {
    ripple: true,
    inputStyle: 'outlined',
    locale: 'es',
    appendTo: 'self',
    hideOverlaysOnDocumentScrolling: false,
    nonce: undefined,
    nullSortOrder: 1,
    zIndex: {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100,
        toast: 1200
    }
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
    <Provider store={store}>
        <React.StrictMode>
            <PrimeReactProvider value={primeReactConfig}>
                <App />
            </PrimeReactProvider>
        </React.StrictMode>
    </Provider>
);

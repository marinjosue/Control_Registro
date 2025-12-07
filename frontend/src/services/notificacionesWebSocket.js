import { io } from 'socket.io-client';

class NotificacionesWebSocket {
    constructor() {
        this.socket = null;
        this.callbacks = [];
        this.isConnected = false;
    }

    connect() {
        if (this.socket) return this.socket;

        const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
        
        console.log('🔌 [NOTIFICACIONES_WS] Conectando a:', socketUrl);
        
        this.socket = io(socketUrl, {
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('🔔 WebSocket Conectado');
            this.isConnected = true;
            this.socket.emit('join_notificaciones');
        });

        this.socket.on('disconnect', () => {
            console.log('🔔 WebSocket Desconectado');
            this.isConnected = false;
        });

        this.socket.on('nueva_notificacion', (data) => {
            console.log('🔔 Nueva notificación recibida:', data);
            this.callbacks.forEach(callback => callback(data));
        });

        return this.socket;
    }

    onNuevaNotificacion(callback) {
        this.callbacks.push(callback);
    }

    isSocketConnected() {
        return this.isConnected;
    }

    disconnect() {
        if (this.socket) {
            console.log('🔔 Desconectando WebSocket de notificaciones');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.callbacks = [];
        }
    }
}

const notificacionesWS = new NotificacionesWebSocket();
export default notificacionesWS;
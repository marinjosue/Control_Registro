import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        if (this.socket && this.isConnected) {
            return this.socket;
        }
        
        try {
            // USAR REACT_APP_WEBSOCKET_URL PRIMERO, LUEGO FALLBACK
            const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
            
            console.log('🔌 [WEBSOCKET] Conectando a:', socketUrl);
            
            this.socket = io(socketUrl, {
                transports: ['polling', 'websocket'], 
                timeout: 20000,
                forceNew: true,
                autoConnect: true
            });

            this.socket.on('connect', () => {
                console.log('🔌 [WEBSOCKET] Conectado:', this.socket.id);
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 [WEBSOCKET] Desconectado');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ [WEBSOCKET] Error conexión:', error);
                this.isConnected = false;
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('❌ [WEBSOCKET] Máximo de reintentos alcanzado');
                    this.socket.disconnect();
                }
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('🔄 [WEBSOCKET] Reconectado en intento:', attemptNumber);
                this.isConnected = true;
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                console.log('🔄 [WEBSOCKET] Intento de reconexión:', attemptNumber);
            });

            this.socket.on('reconnect_error', (error) => {
                console.error('❌ [WEBSOCKET] Error en reconexión:', error);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('❌ [WEBSOCKET] Falló la reconexión');
                this.isConnected = false;
            });

            return this.socket;

        } catch (error) {
            console.error('❌ [WEBSOCKET] Error al conectar:', error);
            return null;
        }
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 [WEBSOCKET] Desconectando...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Método para obtener el estado de conexión
    getConnectionStatus() {
        return this.isConnected;
    }

    // Método para escuchar eventos
    on(eventName, callback) {
        if (this.socket) {
            this.socket.on(eventName, callback);
        }
    }

    // Método para dejar de escuchar eventos
    off(eventName, callback) {
        if (this.socket) {
            this.socket.off(eventName, callback);
        }
    }

    // Método para emitir eventos
    emit(eventName, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(eventName, data);
        } else {
            console.warn('⚠️ [WEBSOCKET] No se puede emitir. Socket no conectado');
        }
    }

    // Método para unirse a una sala
    joinRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_room', room);
        }
    }

    // Método para salir de una sala  
    leaveRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_room', room);
        }
    }
}

// Exportar una instancia única (singleton)
const websocketService = new WebSocketService();
export default websocketService;
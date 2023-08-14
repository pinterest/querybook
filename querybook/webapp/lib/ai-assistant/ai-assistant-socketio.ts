import type { Socket } from 'socket.io-client';

import {
    AI_ASSISTANT_REQUEST_EVENT,
    AI_ASSISTANT_RESPONSE_EVENT,
    AICommandType,
} from 'const/aiAssistant';
import SocketIOManager from 'lib/socketio-manager';

class AIAssistantSocket {
    private static NAME_SPACE = '/ai_assistant';

    private socket: Socket = null;
    private socketPromise: Promise<Socket> = null;

    constructor() {
        this.setupSocket();
    }

    public onSocketConnect(socket: Socket) {
        socket.emit('subscribe');
    }

    private setupSocket = async () => {
        if (this.socket) {
            return this.socket;
        }
        if (this.socketPromise) {
            this.socket = await this.socketPromise;
        } else {
            // We need to setup our socket
            this.socketPromise = SocketIOManager.getSocket(
                AIAssistantSocket.NAME_SPACE,
                this.onSocketConnect.bind(this)
            );

            // Setup socket's connection functions
            this.socket = await this.socketPromise;
        }

        this.socket.on('error', (e) => {
            console.error('Socket error', e);
        });

        return this.socket;
    };

    public requestAIAssistant = (command: AICommandType, payload: object) => {
        this.socket.emit(AI_ASSISTANT_REQUEST_EVENT, command, payload);
    };

    public addAIListener = (listener) => {
        this.socket.on(AI_ASSISTANT_RESPONSE_EVENT, listener);
    };

    public removeAIListener = (listener) => {
        this.socket.off(AI_ASSISTANT_RESPONSE_EVENT, listener);
    };
}

const defaultSocket = new AIAssistantSocket();
export default defaultSocket;

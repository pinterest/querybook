import type { Socket } from 'socket.io-client';

import { AICommandType } from 'const/aiAssistant';
import SocketIOManager from 'lib/socketio-manager';

export class AIAssistantSocket {
    private static NAME_SPACE = '/ai_assistant';

    private socket: Socket = null;
    private socketPromise: Promise<Socket> = null;

    public constructor() {
        this.setupSocket();
    }

    public emit = (command: AICommandType, payload: object) => {
        this.socket.emit(command, payload);
    };

    public addListener = (
        command: string,
        listener: (event: string, payload: object) => void
    ) => {
        this.socket.on(command, listener);
    };

    public removeListener = (
        command: string,
        listener: (event: string, payload: object) => void
    ) => {
        this.socket.off(command, listener);
    };

    private setupSocket = async () => {
        if (this.socket) {
            return this.socket;
        }
        if (this.socketPromise) {
            this.socket = await this.socketPromise;
        } else {
            // We need to setup our socket
            this.socketPromise = SocketIOManager.getSocket(
                AIAssistantSocket.NAME_SPACE
            );

            // Setup socket's connection functions
            this.socket = await this.socketPromise;
        }

        this.socket.on('error', (e) => {
            console.error('Socket error', e);
        });

        return this.socket;
    };
}

const defaultSocket = new AIAssistantSocket();
export default defaultSocket;

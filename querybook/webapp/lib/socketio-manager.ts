import { debounce } from 'lodash';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

/*
This module manages all incoming websocket connections using socketIO,
please do not use socketio individually and only use this to avoid repeated
socket creation
*/

class OpenSocketManager {
    private _openSocket: {
        [nameSpace: string]: Promise<Socket>;
    } = {};

    public hasSocket(nameSpace: string) {
        return nameSpace in this._openSocket;
    }

    public async getSocket(nameSpace: string) {
        return this._openSocket[nameSpace];
    }

    public async addSocket(nameSpace: string, socketPromise: Promise<Socket>) {
        this._openSocket[nameSpace] = socketPromise;
    }

    public removeSocket(nameSpace: string) {
        delete this._openSocket[nameSpace];
    }
}
const openSocketManager = new OpenSocketManager();

const socketIOConfig = {
    secure: true,
    path: '/-/socket.io',
    transports: ['websocket'],
};

const sendErrorToastDebounced = debounce(
    (error) => {
        toast.error(String(error));
    },
    2000,
    { maxWait: 3000 }
);

export default {
    getSocket: async (
        nameSpace = '/',
        onConnection: (socket: Socket) => void = null
    ) => {
        if (openSocketManager.hasSocket(nameSpace)) {
            return openSocketManager.getSocket(nameSpace);
        }

        const socket = io(nameSpace, socketIOConfig);

        // wait for connection
        const socketCreationPromise = new Promise<Socket>((resolve) => {
            socket.on('connect', () => {
                sendErrorToastDebounced.cancel();
                if (onConnection) {
                    onConnection(socket);
                }
                resolve(socket);
            });

            socket.on('connect_error', (error: Error) => {
                sendErrorToastDebounced(
                    'Connection Error: ' + error.toString()
                );
                openSocketManager.removeSocket(nameSpace);
            });

            socket.on('connect_timeout', (timeout) => {
                sendErrorToastDebounced(
                    'Connection Timeout: ' + String(timeout)
                );
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    sendErrorToastDebounced(
                        'Websocket was disconnected due to authentication issue. Please try to refresh the page.'
                    );
                } else if (reason !== 'io client disconnect') {
                    sendErrorToastDebounced(
                        `Websocket was disconnected due to: ${reason}`
                    );
                }
                openSocketManager.removeSocket(nameSpace);
            });
        });

        openSocketManager.addSocket(nameSpace, socketCreationPromise);
        await socketCreationPromise;

        return socket;
    },
    removeSocket: async (nameSpace: string) => {
        if (openSocketManager.hasSocket(nameSpace)) {
            const socket = await openSocketManager.getSocket(nameSpace);
            if (socket.connected) {
                socket.disconnect();
            }
            socket.offAny();
            openSocketManager.removeSocket(nameSpace);
        }
    },
};

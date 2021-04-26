import { throttle } from 'lodash';
import toast from 'react-hot-toast';
import { Manager } from 'socket.io-client';
/*
This module manages all incoming websocket connections using socketIO,
please do not use socketio individually and only use this to avoid repeated
socket creation
*/

const socketIOPath = `${location.protocol}//${location.host}`;
const socketIOManager = new Manager(socketIOPath, {
    secure: true,
    path: '/-/socket.io',
    transports: ['websocket'],
    autoConnect: false,
});

function getSocketFromManager(nameSpace: string) {
    return socketIOManager.socket(nameSpace);
}

const sendToastForError = throttle((error) => {
    toast.error(String(error));
}, 3000);

export default {
    getSocket: async (
        nameSpace = '/',
        onConnection: (socket: SocketIOClient.Socket) => void = null
    ) => {
        const socket = getSocketFromManager(nameSpace);

        if (!socket.connected) {
            socket.connect();
            // wait for connection
            await new Promise<void>((resolve) => {
                socket.on('connect', () => {
                    if (onConnection) {
                        onConnection(socket);
                    }
                    resolve();
                });

                socket.on('connect_error', (error: Error) => {
                    sendToastForError(error.toString());
                });

                socket.on('connect_timeout', (timeout) => {
                    sendToastForError(timeout);
                });

                socket.on('disconnect', (reason: string) => {
                    if (reason === 'io server disconnect') {
                        toast.error(
                            'Websocket was disconnected due to authentication issue. Please try to refresh the page.'
                        );
                    } else {
                        toast.error(
                            `Websocket was disconnected due to: ${reason}`
                        );
                    }
                });
            });
        }
        return socket;
    },
    removeSocket: (socket: SocketIOClient.Socket) => {
        if (socket) {
            if (socket.connected) {
                socket.close();
            }
            socket.removeAllListeners();
        }
    },
};

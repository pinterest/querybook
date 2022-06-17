import { debounce } from 'lodash';
import toast from 'react-hot-toast';
import { Manager, Socket } from 'socket.io-client';

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
        const socket = getSocketFromManager(nameSpace);

        if (!socket.connected) {
            socket.connect();
            // wait for connection
            await new Promise<void>((resolve) => {
                socket.on('connect', () => {
                    sendErrorToastDebounced.cancel();
                    if (onConnection) {
                        onConnection(socket);
                    }
                    resolve();
                });

                socket.on('connect_error', (error: Error) => {
                    sendErrorToastDebounced(error.toString());
                });

                socket.on('connect_timeout', (timeout) => {
                    sendErrorToastDebounced(timeout);
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
                });
            });
        }
        return socket;
    },
    removeSocket: (socket: Socket) => {
        if (socket) {
            if (socket.connected) {
                socket.close();
            }
            socket.offAny();
        }
    },
};

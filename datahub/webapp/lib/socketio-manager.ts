import { throttle } from 'lodash';
import * as SocketIOClient from 'socket.io-client';

import { sendNotification } from './globalUI';

/*
This module manages all incoming websocket connections using socketIO,
please do not use socketio individually and only use this to avoid repeated
socket creation
*/

const socketIOPath = `${location.protocol}//${location.host}`;

const socketByNameSpace: Record<string, SocketIOClient.Socket> = {};

let showingError = false;
const sendNotificationForError = throttle((error) => {
    if (!showingError) {
        showingError = true;
        sendNotification(error, {
            onHide: () => {
                showingError = false;
            },
        });
    }
}, 3000);

export default {
    getSocket: async (
        nameSpace = '/',
        onConnection: (socket: SocketIOClient.Socket) => any = null
    ) => {
        let socket = socketByNameSpace[nameSpace];

        if (!socket) {
            const newSocket = SocketIOClient(`${socketIOPath}${nameSpace}`, {
                secure: true,
                path: '/-/socket.io',
                transports: ['websocket'],
            });
            socketByNameSpace[nameSpace] = newSocket;
            socket = newSocket;
        }

        if (!socket.connected) {
            socket.connect();
            // wait for connection
            await new Promise((resolve) => {
                socket.on('connect', () => {
                    if (onConnection) {
                        onConnection(socket);
                    }
                    resolve();
                });

                socket.on('connect_error', (error) => {
                    sendNotificationForError(error.toString());
                });

                socket.on('connect_timeout', (timeout) => {
                    sendNotificationForError(timeout);
                });
            });
        }
        return socket;
    },

    removeSocket: (nameSpace = '/') => {
        const socket = socketByNameSpace[nameSpace];
        if (socket && socket.connected) {
            socket.close();
        }
        delete socketByNameSpace[nameSpace];
    },
};

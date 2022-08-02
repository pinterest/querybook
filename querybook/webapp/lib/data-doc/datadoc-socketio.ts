import type { Socket } from 'socket.io-client';

import { IAccessRequest } from 'const/accessRequest';
import { IDataCellMeta, IDataDocEditor } from 'const/datadoc';
import { IQueryExecution } from 'const/queryExecution';
import SocketIOManager from 'lib/socketio-manager';
import { DataDocResource } from 'resource/dataDoc';

interface IDataDocSocketPromise<T> {
    args: T;
    isSameOrigin: boolean;
}
interface IDataDocSocketEventPromise<A = () => any, R = (e) => any> {
    resolve: A;
    reject?: R;
}

export interface IDataDocSocketEvent {
    receiveDataDoc?: IDataDocSocketEventPromise<(rawDataDoc) => any>;
    receiveDataDocEditors?: IDataDocSocketEventPromise<(editors: any[]) => any>;
    receiveDataDocAccessRequests?: IDataDocSocketEventPromise<
        (requests: IAccessRequest[]) => any
    >;

    updateDataDoc?: IDataDocSocketEventPromise<
        (rawDataDoc, isSameOrigin: boolean) => any
    >;

    updateDataCell?: IDataDocSocketEventPromise<
        (rawDataCell, isSameOrigin: boolean) => any
    >;
    insertDataCell?: IDataDocSocketEventPromise<
        (index: number, rawDataCell, isSameOrigin: boolean) => any
    >;
    deleteDataCell?: IDataDocSocketEventPromise<
        (cellId: number, isSameOrigin: boolean) => any
    >;
    moveDataCell?: IDataDocSocketEventPromise<
        (fromIndex: number, toIndex: number, isSameOrigin: boolean) => any
    >;

    updateDataDocUsers?: IDataDocSocketEventPromise<
        (
            sidToUid: Record<string, number>,
            sidToCellId: Record<string, number>
        ) => any
    >;
    updateDataDocEditor?: IDataDocSocketEventPromise<
        (
            docId: number,
            uid: number,
            editor: IDataDocEditor | null,
            isSameOrigin: boolean
        ) => any
    >;
    updateDataDocAccessRequest?: IDataDocSocketEventPromise<
        (
            docId: number,
            uid: number,
            request: IAccessRequest | null,
            isSameOrigin: boolean
        ) => any
    >;

    receiveQueryExecution?: IDataDocSocketEventPromise<
        (
            queryExecution: IQueryExecution,
            dataCellId: number,
            isSameOrigin: boolean
        ) => any
    >;

    receiveFocusCell?: IDataDocSocketEventPromise<
        (dataCellId: number, uid: number, isSameOrigin: boolean) => any
    >;

    moveDataDocCursor?: IDataDocSocketEventPromise<
        (sid: string, dataCellId?: number) => any
    >;

    receiveDataDocUser?: IDataDocSocketEventPromise<
        (add: boolean, sid: string, uid: number) => any
    >;
}

export class DataDocSocket {
    private static NAME_SPACE = '/datadoc';

    private _activeDataDocId: number = null;
    private socket: Socket = null;
    private socketPromise: Promise<Socket> = null;

    private promiseMap: IDataDocSocketEvent = {};
    private eventMap: IDataDocSocketEvent = {};

    public get activeDataDocId() {
        return this.socket && this._activeDataDocId != null
            ? this._activeDataDocId
            : null;
    }

    public get socketId(): string {
        return this.socket?.id;
    }

    public addDataDoc = async (
        docId: number,
        eventMap: IDataDocSocketEvent
    ) => {
        if (docId !== this._activeDataDocId && this._activeDataDocId != null) {
            this.removeDataDoc(this._activeDataDocId, false);
        }
        this.eventMap = eventMap;

        await this.setupSocket();
        this._activeDataDocId = docId;
        this.socket.emit('subscribe', docId);

        this.getDataDocEditors(docId);
        this.getDataDocAccessRequests(docId);
    };

    public removeDataDoc = (docId: number, removeSocket = true) => {
        if (docId === this._activeDataDocId) {
            // Otherwise its NOOP
            this._activeDataDocId = null;

            if (this.socket) {
                // Leave the socket room
                this.socket.emit('unsubscribe', docId);
            }

            this.promiseMap = {};
            if (removeSocket) {
                // If we are not running any query any more, break off the socketio connection
                SocketIOManager.removeSocket(DataDocSocket.NAME_SPACE);
                this.socket = null;
                this.socketPromise = null;
            }
        }
    };

    public getDataDocEditors = (docId: number) => {
        this.socket.emit('fetch_data_doc_editors', docId);
        return this.makePromise<IDataDocSocketPromise<[editors: any[]]>>(
            'receiveDataDocEditors'
        );
    };

    public getDataDocAccessRequests = (docId: number) => {
        this.socket.emit('fetch_data_doc_access_requests', docId);
        return this.makePromise<
            IDataDocSocketPromise<[requests: IAccessRequest[]]>
        >('receiveDataDocAccessRequests');
    };

    public updateDataDoc = (docId: number, fields: Record<string, any>) => {
        this.socket.emit('update_data_doc', docId, fields);
        return this.makePromise<IDataDocSocketPromise<[rawDataDoc: any]>>(
            'updateDataDoc'
        );
    };

    public updateDataCell = (
        cellId: number,
        fields: { meta?: IDataCellMeta; context?: string }
    ) =>
        DataDocResource.updateCell(cellId, fields, this.socketId).then(
            (resp) => resp.data
        );

    public deleteDataCell = (docId: number, cellId: number) => {
        this.socket.emit('delete_data_cell', docId, cellId);
        return this.makePromise<IDataDocSocketPromise<[index: number]>>(
            'deleteDataCell'
        );
    };

    public moveDataDocCell = (
        docId: number,
        fromIndex: number,
        toIndex: number
    ) => {
        this.socket.emit('move_data_cell', docId, fromIndex, toIndex);
        return this.makePromise<
            IDataDocSocketPromise<[fromIndex: number, toIndex: number]>
        >('moveDataCell');
    };

    public pasteDataCell = (
        cellId: number,
        cut: boolean,
        docId: number, // copy to this doc
        index: number
    ) => {
        this.socket.emit('paste_data_cell', cellId, cut, docId, index);
        return this.makePromise<IDataDocSocketPromise<[]>>('pasteDataCell');
    };

    public insertDataDocCell = (
        docId: number,
        index: number,
        cellType: string,
        context: string,
        meta: IDataCellMeta
    ) => {
        this.socket.emit(
            'insert_data_cell',
            docId,
            index,
            cellType,
            context,
            meta
        );
        return this.makePromise<
            IDataDocSocketPromise<[index: number, rawDataCell: any]>
        >('insertDataCell');
    };

    public moveDataDocCursor = (docId: number, cellId?: number) => {
        if (this.activeDataDocId != null) {
            this.socket.emit('move_data_doc_cursor', docId, cellId);
            return this.makePromise<
                IDataDocSocketPromise<
                    [originator: string, cellId: number | null | undefined]
                >
            >('moveDataDocCursor');
        }
    };

    private onSocketConnect(socket: Socket) {
        if (this._activeDataDocId != null) {
            socket.emit('subscribe', this._activeDataDocId);
        }
    }

    private makePromise<T = any>(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.promiseMap[key] = {
                resolve,
                reject,
            };
        });
    }

    private checkIsSameOrigin(originator: string) {
        return originator === this.socket?.id;
    }

    private resolvePromise(key: string, isSameOrigin: boolean, ...args: any[]) {
        // Only resolve promise if it is from the same sender
        if (isSameOrigin) {
            if (key in this.promiseMap) {
                this.promiseMap[key].resolve({
                    args,
                    isSameOrigin,
                });
                delete this.promiseMap[key];
            }
        }
    }

    private resolvePromiseAndEvent(
        key: string,
        originator: string,
        ...args: any[]
    ) {
        const isSameOrigin = this.checkIsSameOrigin(originator);
        this.resolvePromise(key, isSameOrigin, ...args);
        if (key in this.eventMap) {
            this.eventMap[key].resolve(...args, isSameOrigin);
        }
    }

    private setupSocket = async () => {
        if (this.socketPromise) {
            await this.socketPromise;
        } else {
            // We need to setup our socket
            this.socketPromise = SocketIOManager.getSocket(
                DataDocSocket.NAME_SPACE,
                this.onSocketConnect.bind(this)
            );

            // Setup socket's connection functions
            this.socket = await this.socketPromise;

            this.socket.on('data_doc', (originator, rawDataDoc) => {
                this.resolvePromiseAndEvent(
                    'receiveDataDoc',
                    originator,
                    rawDataDoc
                );
            });

            this.socket.on('data_doc_editors', (originator, editors) => {
                this.resolvePromiseAndEvent(
                    'receiveDataDocEditors',
                    originator,
                    editors
                );
            });

            this.socket.on(
                'data_doc_access_requests',
                (originator, requests) => {
                    this.resolvePromiseAndEvent(
                        'receiveDataDocAccessRequests',
                        originator,
                        requests
                    );
                }
            );

            this.socket.on('data_doc_updated', (originator, rawDataDoc) => {
                this.resolvePromiseAndEvent(
                    'updateDataDoc',
                    originator,
                    rawDataDoc
                );
            });

            this.socket.on('data_cell_updated', (originator, rawDataCell) => {
                this.resolvePromiseAndEvent(
                    'updateDataCell',
                    originator,
                    rawDataCell
                );
            });

            this.socket.on('data_cell_deleted', (originator, cellId) => {
                this.resolvePromiseAndEvent(
                    'deleteDataCell',
                    originator,
                    cellId
                );
            });

            this.socket.on(
                'data_cell_inserted',
                (originator, index, rawDataCell) => {
                    this.resolvePromiseAndEvent(
                        'insertDataCell',
                        originator,
                        index,
                        rawDataCell
                    );
                }
            );

            this.socket.on(
                'data_cell_moved',
                (originator, fromIndex, toIndex) => {
                    this.resolvePromiseAndEvent(
                        'moveDataCell',
                        originator,
                        fromIndex,
                        toIndex
                    );
                }
            );

            this.socket.on('data_cell_pasted', (originator) => {
                this.resolvePromise(
                    'pasteDataCell',
                    this.checkIsSameOrigin(originator)
                );
            });

            this.socket.on(
                'data_doc_sessions',
                ({
                    users: sidToUid,
                    cursors: sidToCellId,
                }: {
                    users: Record<string, number>;
                    cursors: Record<string, number>;
                }) =>
                    this.resolvePromiseAndEvent(
                        'updateDataDocUsers',
                        '',
                        sidToUid,
                        sidToCellId
                    )
            );

            this.socket.on(
                'data_doc_editor',
                (originator, docId, uid, editor) => {
                    this.resolvePromiseAndEvent(
                        'updateDataDocEditor',
                        originator,
                        docId,
                        uid,
                        editor
                    );
                }
            );

            this.socket.on(
                'data_doc_access_request',
                (originator, docId, uid, request) => {
                    this.resolvePromiseAndEvent(
                        'updateDataDocAccessRequest',
                        originator,
                        docId,
                        uid,
                        request
                    );
                }
            );

            this.socket.on(
                'data_doc_query_execution',
                (originator, rawQueryExecution, dataCellId) =>
                    this.resolvePromiseAndEvent(
                        'receiveQueryExecution',
                        originator,
                        rawQueryExecution,
                        dataCellId
                    )
            );

            this.socket.on('data_doc_cursor_moved', (originator, cellId) =>
                this.resolvePromiseAndEvent(
                    'moveDataDocCursor',
                    originator,
                    originator,
                    cellId
                )
            );

            this.socket.on(
                'data_doc_user',
                (add: boolean, sid: string, uid: number) =>
                    this.resolvePromiseAndEvent(
                        'receiveDataDocUser',
                        '',
                        add,
                        sid,
                        uid
                    )
            );

            this.socket.on('error', (e) => {
                Object.values(this.promiseMap).map(({ reject }) => reject?.(e));
            });
        }
    };
}

const defaultSocket = new DataDocSocket();
export default defaultSocket;

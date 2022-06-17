import { sortBy } from 'lodash';

import { IDataDoc, IDataDocEditor } from 'const/datadoc';

export enum DataDocPermission {
    CAN_READ = 'read only',
    CAN_WRITE = 'edit',
    OWNER = 'owner',
    NULL = 'no access',
}

export interface IViewerInfo {
    uid: number;
    online: boolean;
    permission: DataDocPermission;
    editorId?: number;
}

export function readWriteToPermission(
    read: boolean,
    write: boolean,
    isOwner: boolean,
    publicDoc: boolean
): DataDocPermission {
    if (isOwner) {
        return DataDocPermission.OWNER;
    }
    if (write) {
        return DataDocPermission.CAN_WRITE;
    }
    if (read || publicDoc) {
        return DataDocPermission.CAN_READ;
    }

    return DataDocPermission.NULL;
}

export function permissionToReadWrite(permission: DataDocPermission): {
    read: boolean;
    write: boolean;
} {
    if (permission === DataDocPermission.CAN_READ) {
        return {
            read: true,
            write: false,
        };
    } else if (
        permission === DataDocPermission.CAN_WRITE ||
        permission === DataDocPermission.OWNER
    ) {
        return {
            read: true,
            write: true,
        };
    }

    return {
        read: false,
        write: false,
    };
}

export function getViewerInfo(
    uid: number,
    editorsByUserId: Record<number, IDataDocEditor>,
    dataDoc: IDataDoc,
    viewerIds: number[]
): IViewerInfo {
    const editor = uid in editorsByUserId ? editorsByUserId[uid] : null;
    const permission = readWriteToPermission(
        editor ? editor.read : false,
        editor ? editor.write : false,
        dataDoc.owner_uid === uid,
        dataDoc.public
    );
    const online = viewerIds.includes(uid);
    return {
        editorId: editor?.id,
        uid,
        online,
        permission,
    };
}

export function sortViewersInfo(viewersInfo: IViewerInfo[]) {
    return sortBy(viewersInfo, [
        (info) => (info.online ? 0 : 1),
        (info) => (info.permission === DataDocPermission.OWNER ? 0 : 1),
        (info) => -(info.editorId ?? Infinity),
        'uid',
    ]);
}

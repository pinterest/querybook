import { sortBy } from 'lodash';

import { IDataDoc, IDataDocEditor } from 'const/datadoc';

export enum Permission {
    CAN_READ = 'read only',
    CAN_WRITE = 'edit',
    OWNER = 'owner',
    NULL = 'no access',
}

export interface IViewerInfo {
    uid: number;
    online?: boolean;
    permission: Permission;
    editorId?: number;
}

export function readWriteToPermission(
    read: boolean,
    write: boolean,
    isOwner: boolean,
    publicDoc: boolean
): Permission {
    if (isOwner) {
        return Permission.OWNER;
    }
    if (write) {
        return Permission.CAN_WRITE;
    }
    if (read || publicDoc) {
        return Permission.CAN_READ;
    }

    return Permission.NULL;
}

export function permissionToReadWrite(permission: Permission): {
    read: boolean;
    write: boolean;
} {
    if (permission === Permission.CAN_READ) {
        return {
            read: true,
            write: false,
        };
    } else if (
        permission === Permission.CAN_WRITE ||
        permission === Permission.OWNER
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
        (info) => (info.permission === Permission.OWNER ? 0 : 1),
        (info) => -(info.editorId ?? Infinity),
        'uid',
    ]);
}

import { sortBy } from 'lodash';

import { IBoardEditor } from 'const/board';
import { IDataDoc, IDataDocEditor } from 'const/datadoc';

export enum Permission {
    CAN_READ = 'read only',
    CAN_WRITE = 'edit',
    CAN_EXECUTE = 'execute',
    OWNER = 'owner',
    NULL = 'no access',
    INHERITED_READ = '[INHERITED] read only',
    INHERITED_WRITE = '[INHERITED] edit',
    INHERITED_EXECUTE = '[INHERITED] execute',
}

export interface IViewerInfo {
    uid: number;
    online?: boolean;
    permission: Permission;
    editorId?: number;
}

export function editorToPermission(
    isOwner: boolean,
    editor: IDataDocEditor | IBoardEditor | undefined | null
): Permission {
    if (isOwner) {
        return Permission.OWNER;
    }
    if (!editor) {
        return Permission.NULL;
    }
    if (editor.write) {
        return editor.id == null
            ? Permission.INHERITED_WRITE
            : Permission.CAN_WRITE;
    }
    if (editor['execute']) {
        return editor.id == null
            ? Permission.INHERITED_EXECUTE
            : Permission.CAN_EXECUTE;
    }
    if (editor.read) {
        return editor.id == null
            ? Permission.INHERITED_READ
            : Permission.CAN_READ;
    }
    return Permission.NULL;
}

export function permissionToReadWrite(permission: Permission): {
    read: boolean;
    execute: boolean;
    write: boolean;
} {
    if (
        permission === Permission.CAN_READ ||
        permission === Permission.INHERITED_READ
    ) {
        return {
            read: true,
            execute: false,
            write: false,
        };
    } else if (
        permission === Permission.CAN_EXECUTE ||
        permission === Permission.INHERITED_EXECUTE
    ) {
        return {
            read: true,
            execute: true,
            write: false,
        };
    } else if (
        permission === Permission.CAN_WRITE ||
        permission === Permission.OWNER ||
        permission === Permission.INHERITED_WRITE
    ) {
        return {
            read: true,
            execute: true,
            write: true,
        };
    }

    return {
        read: false,
        execute: false,
        write: false,
    };
}

export function getViewerInfo(
    uid: number,
    editorsByUserId: Record<number, IDataDocEditor>,
    dataDoc: IDataDoc,
    viewerIds: number[],
    nonExplicitEditorPermissions: Record<number, IDataDocEditor>
): IViewerInfo {
    let editor = null;
    if (uid in editorsByUserId) {
        editor = editorsByUserId[uid];
    } else if (uid in nonExplicitEditorPermissions) {
        editor = nonExplicitEditorPermissions[uid];
    }
    const permission = editorToPermission(dataDoc.owner_uid === uid, editor);
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

import clsx from 'clsx';
import React from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { IAccessRequest } from 'const/accessRequest';
import { IDataDoc, IDataDocEditor } from 'const/datadoc';
import {
    IViewerInfo,
    Permission,
    permissionToReadWrite,
} from 'lib/data-doc/datadoc-permission';
import { addDataDocAccessRequest } from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';
import { ViewersList } from 'ui/ViewersList/ViewersList';

interface IDataDocViewersListProps {
    className?: string;
    viewerInfos: IViewerInfo[];
    editorsByUid: Record<number, IDataDocEditor>;
    dataDoc: IDataDoc;
    readonly: boolean;
    isOwner: boolean;
    accessRequestsByUid: Record<number, IAccessRequest>;

    addDataDocEditor: (uid: number, permission: Permission) => any;
    changeDataDocPublic: (docId: number, docPublic: boolean) => any;
    updateDataDocEditors: (uid: number, read: boolean, write: boolean) => any;
    deleteDataDocEditor: (uid: number) => any;
    updateDataDocOwner: (nextOwnerId: number) => any;
    rejectDataDocAccessRequest: (uid: number) => any;
}

export const DataDocViewersList: React.FunctionComponent<
    IDataDocViewersListProps
> = ({
    viewerInfos,
    dataDoc,
    editorsByUid,
    readonly,
    isOwner,
    className = '',
    accessRequestsByUid,

    addDataDocEditor,
    changeDataDocPublic,
    updateDataDocEditors,
    deleteDataDocEditor,
    updateDataDocOwner,
    rejectDataDocAccessRequest,
}) => {
    const dispatch: Dispatch = useDispatch();
    const handleDataDocAccessRequest = React.useCallback(() => {
        dispatch(addDataDocAccessRequest(dataDoc.id));
    }, [dataDoc.id]);

    const combinedClassname = clsx({
        [className]: className,
        DataDocViewersList: true,
    });

    const onTabSelect = React.useCallback(
        (isPublic) => {
            if (!readonly) {
                changeDataDocPublic(dataDoc.id, isPublic);
            }
        },
        [changeDataDocPublic, dataDoc.id, readonly]
    );

    const onUserSelect = React.useCallback(
        (uid: number) => {
            if (uid in editorsByUid || uid === dataDoc.owner_uid) {
                toast.error('User already added.');
            } else {
                const newUserPermission = dataDoc.public
                    ? Permission.CAN_WRITE
                    : Permission.CAN_READ;
                addDataDocEditor(uid, newUserPermission);
            }
        },
        [addDataDocEditor, dataDoc.owner_uid, dataDoc.public, editorsByUid]
    );

    const onPermissionChange = React.useCallback(
        (permission: Permission, uid: number) => {
            if (permission === Permission.OWNER) {
                updateDataDocOwner(uid);
            } else {
                const { read, write } = permissionToReadWrite(permission);
                if (uid in editorsByUid) {
                    updateDataDocEditors(uid, read, write);
                } else {
                    addDataDocEditor(uid, permission);
                }
            }
        },
        [
            addDataDocEditor,
            editorsByUid,
            updateDataDocEditors,
            updateDataDocOwner,
        ]
    );

    const onRemoveEditor = React.useCallback(
        (uid: number) => {
            if (uid in editorsByUid) {
                deleteDataDocEditor(uid);
            }
        },
        [deleteDataDocEditor, editorsByUid]
    );

    return (
        <ViewersList
            entityName="document"
            className={combinedClassname}
            readonly={readonly}
            isPublic={dataDoc.public}
            onPublicToggle={onTabSelect}
            onAccessRequest={handleDataDocAccessRequest}
            onUserSelect={onUserSelect}
            infoToShow={viewerInfos}
            onPermissionChange={onPermissionChange}
            accessRequestsByUid={accessRequestsByUid}
            onRemoveEditor={onRemoveEditor}
            addEditor={addDataDocEditor}
            rejectAccessRequest={rejectDataDocAccessRequest}
            isOwner={isOwner}
        />
    );
};

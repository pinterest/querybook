import clsx from 'clsx';
import React from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import {
    IViewerInfo,
    permissionToReadWrite,
    DataDocPermission,
} from 'lib/data-doc/datadoc-permission';
import { canCurrentUserEditSelector } from 'redux/dataDoc/selector';
import { addDataDocAccessRequest } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { IDataDoc, IDataDocEditor } from 'const/datadoc';
import { IAccessRequest } from 'const/accessRequest';

import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { DataDocAccessRequestPermissionPicker } from 'components/DataDocAccessRequestPermissionPicker.tsx/DataDocAccessRequestPermissionPicker';
import { ViewerPermissionPicker } from './ViewerPermissionPicker';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { UserSelect } from 'components/UserSelect/UserSelect';

import { Tabs } from 'ui/Tabs/Tabs';

import './DataDocViewersList.scss';
import { StyledText } from 'ui/StyledText/StyledText';

interface IDataDocViewersListProps {
    className?: string;
    viewerInfos: IViewerInfo[];
    editorsByUid: Record<number, IDataDocEditor>;
    dataDoc: IDataDoc;
    readonly: boolean;
    isOwner: boolean;
    accessRequestsByUid: Record<number, IAccessRequest>;

    addDataDocEditor: (uid: number, permission: DataDocPermission) => any;
    changeDataDocPublic: (docId: number, docPublic: boolean) => any;
    updateDataDocEditors: (uid: number, read: boolean, write: boolean) => any;
    deleteDataDocEditor: (uid: number) => any;
    updateDataDocOwner: (nextOwnerId: number) => any;
    rejectDataDocAccessRequest: (uid: number) => any;
}

export const DataDocViewersList: React.FunctionComponent<IDataDocViewersListProps> = ({
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

    const isEditor = useSelector((state: IStoreState) =>
        canCurrentUserEditSelector(state, dataDoc.id)
    );

    const addUserRowDOM = readonly ? null : (
        <div className="datadoc-add-user-row">
            <div className="user-select-wrapper">
                <UserSelect
                    onSelect={(uid) => {
                        if (uid in editorsByUid || uid === dataDoc.owner_uid) {
                            toast.error('User already added.');
                        } else {
                            const newUserPermission = dataDoc.public
                                ? DataDocPermission.CAN_WRITE
                                : DataDocPermission.CAN_READ;
                            addDataDocEditor(uid, newUserPermission);
                        }
                    }}
                    selectProps={{
                        isClearable: true,
                    }}
                    clearAfterSelect
                />
            </div>
        </div>
    );

    const viewerInfosToShow = dataDoc.public
        ? viewerInfos.filter(
              (viewer) => viewer.permission !== DataDocPermission.CAN_READ
          )
        : viewerInfos;

    const viewersListDOM = viewerInfosToShow.map((info) => (
        <div key={info.uid} className="viewers-user-row">
            <div className="user-badge-wrapper">
                <UserBadge isOnline={info.online} uid={info.uid} />
            </div>
            <div className="access-info">
                <div>
                    <ViewerPermissionPicker
                        readonly={readonly}
                        publicDataDoc={dataDoc.public}
                        isOwner={isOwner}
                        viewerInfo={info}
                        onPermissionChange={(permission) => {
                            if (permission === DataDocPermission.OWNER) {
                                updateDataDocOwner(info.uid);
                            } else {
                                const { read, write } = permissionToReadWrite(
                                    permission
                                );
                                if (info.uid in editorsByUid) {
                                    updateDataDocEditors(info.uid, read, write);
                                } else {
                                    addDataDocEditor(info.uid, permission);
                                }
                            }
                        }}
                        onRemoveEditor={
                            info.uid in editorsByUid
                                ? () => deleteDataDocEditor(info.uid)
                                : null
                        }
                    />
                </div>
            </div>
        </div>
    ));

    const accessRequestListDOM = readonly
        ? null
        : Object.values(accessRequestsByUid).map((request) => (
              <div key={request.uid} className="viewers-user-row">
                  <div className="user-badge-wrapper">
                      <UserBadge isOnline={undefined} uid={request.uid} />
                  </div>
                  <div className="access-info">
                      <DataDocAccessRequestPermissionPicker
                          uid={request.uid}
                          addDataDocEditor={addDataDocEditor}
                          rejectDataDocAccessRequest={
                              rejectDataDocAccessRequest
                          }
                      />
                  </div>
              </div>
          ));

    const contentDOM = (
        <div className="viewers-list-wrapper">
            {accessRequestListDOM}
            {viewersListDOM}
        </div>
    );
    const dataDocPublicRow = (
        <>
            <div className="public-row-switch">
                <Tabs
                    selectedTabKey={dataDoc.public ? 'Public' : 'Private'}
                    pills
                    align="center"
                    items={['Private', 'Public']}
                    onSelect={
                        readonly
                            ? null
                            : (checked) =>
                                  changeDataDocPublic(
                                      dataDoc.id,
                                      checked === 'Public'
                                  )
                    }
                    disabled={readonly}
                />
            </div>
            <div className="flex-column">
                <StyledText color="light" noUserSelect>
                    {dataDoc.public
                        ? 'This document can be viewed by anyone'
                        : 'Only invited users can view this document'}
                </StyledText>
                {isEditor ? null : (
                    <div className="mt12">
                        <AccessRequestButton
                            onAccessRequest={handleDataDocAccessRequest}
                            isEdit
                        />
                    </div>
                )}
            </div>
        </>
    );

    const combinedClassname = clsx({
        [className]: className,
        DataDocViewersList: true,
    });

    return (
        <div className={combinedClassname}>
            {dataDocPublicRow}
            {addUserRowDOM}
            {contentDOM}
        </div>
    );
};

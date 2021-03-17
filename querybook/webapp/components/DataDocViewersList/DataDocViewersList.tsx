import clsx from 'clsx';
import React from 'react';
import toast from 'react-hot-toast';

import {
    IViewerInfo,
    permissionToReadWrite,
    DataDocPermission,
} from 'lib/data-doc/datadoc-permission';
import { UserBadge } from 'components/UserBadge/UserBadge';

import './DataDocViewersList.scss';
import { IDataDoc, IDataDocEditor } from 'const/datadoc';
import { IAccessRequest } from 'const/accessRequest';

import { Title } from 'ui/Title/Title';

import { ViewerPermissionPicker } from './ViewerPermissionPicker';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { Tabs } from 'ui/Tabs/Tabs';
import { DataDocAccessRequestPermissionPicker } from 'components/DataDocAccessRequestPermissionPicker.tsx/DataDocAccessRequestPermissionPicker';

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

// TODO: make this component use React-Redux directly
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
        <div>
            <div className="viewers-list-wrapper">
                {accessRequestListDOM}
                {viewersListDOM}
            </div>
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
                />
            </div>
            <div className="public-row-description">
                <Title size={6} subtitle>
                    {dataDoc.public
                        ? 'This document can be viewed by anyone.'
                        : 'Only invited users can view this document.'}
                </Title>
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

import classNames from 'classnames';
import React, { useEffect } from 'react';

import {
    IViewerInfo,
    permissionToReadWrite,
    DataDocPermission,
} from 'lib/data-doc/datadoc-permission';
import { UserBadge } from 'components/UserBadge/UserBadge';

import './DataDocViewersList.scss';
import { IDataDoc, IDataDocEditor } from 'const/datadoc';

import { Title } from 'ui/Title/Title';

import { ViewerPermissionPicker } from './ViewerPermissionPicker';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Tabs } from 'ui/Tabs/Tabs';
import { sendNotification } from 'lib/dataHubUI';
import { myUserInfoSelector } from 'redux/user/selector';
import { useSelector } from 'react-redux';

interface IDataDocViewersListProps {
    className?: string;
    viewerInfos: IViewerInfo[];
    editorsByUid: Record<number, IDataDocEditor>;
    dataDoc: IDataDoc;
    readonly: boolean;

    addDataDocEditor: (uid: number, read: boolean, write: boolean) => any;
    changeDataDocPublic: (docId: number, docPublic: boolean) => any;
    updateDataDocEditors: (uid: number, read: boolean, write: boolean) => any;
    deleteDataDocEditor: (uid: number) => any;
    updateDataDocOwner: (
        current_owner_uid: number,
        next_owner_uid: number
    ) => any;
}

// TODO: make this component use React-Redux directly
export const DataDocViewersList: React.FunctionComponent<IDataDocViewersListProps> = ({
    viewerInfos,
    dataDoc,
    editorsByUid,
    readonly,
    className = '',

    addDataDocEditor,
    changeDataDocPublic,
    updateDataDocEditors,
    deleteDataDocEditor,
    updateDataDocOwner,
}) => {
    const userInfo = useSelector(myUserInfoSelector);
    const addUserRowDOM = readonly ? null : (
        <div className="datadoc-add-user-row">
            <div className="user-select-wrapper">
                <UserSelect
                    onSelect={(uid) => {
                        if (uid in editorsByUid) {
                            sendNotification('User already added.');
                        } else {
                            const newUserPermission = dataDoc.public
                                ? DataDocPermission.CAN_WRITE
                                : DataDocPermission.CAN_READ;
                            const { read, write } = permissionToReadWrite(
                                newUserPermission
                            );
                            addDataDocEditor(uid, read, write);
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
                        isOwner={dataDoc.owner_uid == userInfo.id}
                        viewerInfo={info}
                        onPermissionChange={(permission) => {
                            const { read, write } = permissionToReadWrite(
                                permission
                            );
                            if (info.uid in editorsByUid) {
                                updateDataDocEditors(info.uid, read, write);
                            } else {
                                addDataDocEditor(info.uid, read, write);
                            }
                        }}
                        onRemoveEditor={
                            info.uid in editorsByUid
                                ? () => deleteDataDocEditor(info.uid)
                                : null
                        }
                        updateDataDocOwner={(uid) => {
                            updateDataDocOwner(dataDoc.owner_uid, uid);
                        }}
                    />
                </div>
            </div>
        </div>
    ));

    const contentDOM = (
        <div className="viewers-list-wrapper">{viewersListDOM}</div>
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

    const combinedClassname = classNames({
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

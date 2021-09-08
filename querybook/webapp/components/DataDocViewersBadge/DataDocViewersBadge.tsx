import { useDispatch } from 'react-redux';
import React, { useCallback, useRef, useState } from 'react';

import { IStoreState } from 'redux/store/types';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';

import { DataDocViewersList } from 'components/DataDocViewersList/DataDocViewersList';
import './DataDocViewersBadge.scss';
import { Popover } from 'ui/Popover/Popover';
import { Button } from 'ui/Button/Button';
import { DataDocPermission } from 'lib/data-doc/datadoc-permission';
import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';

interface IDataDocViewersBadgeProps {
    numberBadges?: number;
    docId: number;
}

const useDataDocEditorReduxActions = (docId: number) => {
    const dispatch = useDispatch();
    const addDataDocEditor = useCallback(
        (uid: number, permission: DataDocPermission) =>
            dispatch(dataDocActions.addDataDocEditors(docId, uid, permission)),
        [docId]
    );

    const updateDataDocEditors = useCallback(
        (uid: number, read: boolean, write: boolean) =>
            dispatch(
                dataDocActions.updateDataDocEditors(docId, uid, read, write)
            ),
        [docId]
    );

    const changeDataDocPublic = useCallback(
        (docId: number, docPublic: boolean) =>
            dispatch(
                dataDocActions.updateDataDocField(docId, 'public', docPublic)
            ),
        []
    );

    const deleteDataDocEditor = useCallback(
        (uid: number) =>
            dispatch(dataDocActions.deleteDataDocEditor(docId, uid)),
        [docId]
    );

    const updateDataDocOwner = useCallback(
        (nextOwnerId: number) => {
            dispatch(dataDocActions.updateDataDocOwner(docId, nextOwnerId));
        },
        [docId]
    );

    const rejectDataDocAccessRequest = useCallback(
        (uid: number) => {
            dispatch(dataDocActions.rejectDataDocAccessRequest(docId, uid));
        },
        [docId]
    );

    return {
        addDataDocEditor,
        changeDataDocPublic,
        updateDataDocEditors,
        updateDataDocOwner,
        deleteDataDocEditor,
        rejectDataDocAccessRequest,
    };
};

export const DataDocViewersBadge = React.memo<IDataDocViewersBadgeProps>(
    ({ numberBadges = 4, docId }) => {
        const [showViewsList, setShowViewsList] = useState(false);
        const selfRef = useRef<HTMLDivElement>();

        const {
            viewerInfos,
            editorsByUid,
            accessRequestsByUid,
            dataDoc,
            userInfoById,
            readonly,
            ownerId,
        } = useShallowSelector((state: IStoreState) => {
            const viewerInfos = dataDocSelectors.dataDocViewerInfosSelector(
                state,
                docId
            );
            return {
                viewerInfos,
                editorsByUid: dataDocSelectors.dataDocEditorByUidSelector(
                    state,
                    docId
                ),
                accessRequestsByUid: dataDocSelectors.currentDataDocAccessRequestsByUidSelector(
                    state,
                    docId
                ),
                dataDoc: dataDocSelectors.dataDocSelector(state, docId),
                userInfoById: state.user.userInfoById,
                readonly: !dataDocSelectors.canCurrentUserEditSelector(
                    state,
                    docId
                ),
                ownerId: state.user.myUserInfo.uid,
            };
        });

        const {
            addDataDocEditor,
            changeDataDocPublic,
            updateDataDocEditors,
            updateDataDocOwner,
            deleteDataDocEditor,
            rejectDataDocAccessRequest,
        } = useDataDocEditorReduxActions(docId);

        const getBadgeContentDOM = () => {
            const extraViewersCount = viewerInfos.length - numberBadges;

            const viewersDOM = (
                <UserAvatarList
                    users={viewerInfos
                        .slice(0, numberBadges)
                        .map((viewerInfo) => ({
                            uid: viewerInfo.uid,
                            tooltip:
                                viewerInfo.uid in userInfoById
                                    ? userInfoById[viewerInfo.uid].username
                                    : null,
                            isOnline: viewerInfo.online,
                        }))}
                    extraCount={extraViewersCount}
                />
            );

            const accessRequestsByUidLength = Object.keys(accessRequestsByUid)
                .length;
            const shareButtonDOM = (
                <Button
                    className="viewers-badge-share-button"
                    icon={dataDoc.public ? 'users' : 'lock'}
                    title="Share"
                    color="light"
                    pushable
                    ping={
                        !readonly && accessRequestsByUidLength > 0
                            ? accessRequestsByUidLength.toString()
                            : null
                    }
                />
            );

            return (
                <div
                    className="viewers-badge-viewers"
                    onClick={() => setShowViewsList((v) => !v)}
                >
                    {viewersDOM}
                    {shareButtonDOM}
                </div>
            );
        };

        if (!(viewerInfos && viewerInfos.length)) {
            return null;
        }

        const viewsListDOM = showViewsList && (
            <Popover
                anchor={selfRef.current}
                onHide={() => setShowViewsList(false)}
                layout={['bottom', 'right']}
                resizeOnChange
            >
                <DataDocViewersList
                    readonly={readonly}
                    viewerInfos={viewerInfos}
                    accessRequestsByUid={accessRequestsByUid}
                    isOwner={dataDoc.owner_uid === ownerId}
                    editorsByUid={editorsByUid}
                    dataDoc={dataDoc}
                    addDataDocEditor={addDataDocEditor}
                    changeDataDocPublic={changeDataDocPublic}
                    updateDataDocEditors={updateDataDocEditors}
                    deleteDataDocEditor={deleteDataDocEditor}
                    updateDataDocOwner={updateDataDocOwner}
                    rejectDataDocAccessRequest={rejectDataDocAccessRequest}
                />
            </Popover>
        );

        return (
            <div className="DataDocViewersBadge" ref={selfRef}>
                {getBadgeContentDOM()}
                {viewsListDOM}
            </div>
        );
    }
);

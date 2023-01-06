import React, { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { DataDocViewersList } from 'components/DataDocViewersList/DataDocViewersList';
import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { ComponentType, ElementType } from 'const/analytics';
import { DELETED_USER_MSG } from 'const/user';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { trackClick } from 'lib/analytics';
import { Permission } from 'lib/data-doc/datadoc-permission';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';

import './DataDocViewersBadge.scss';

interface IDataDocViewersBadgeProps {
    numberBadges?: number;
    docId: number;
}

const useDataDocEditorReduxActions = (docId: number) => {
    const dispatch = useDispatch();
    const addDataDocEditor = useCallback(
        (uid: number, permission: Permission) =>
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
                accessRequestsByUid:
                    dataDocSelectors.currentDataDocAccessRequestsByUidSelector(
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
                        .map((viewerInfo) => {
                            const userInfo = userInfoById[viewerInfo.uid];
                            let tooltip: string;
                            if (userInfo) {
                                const displayName =
                                    userInfo.fullname ?? userInfo.username;
                                const deletedMessage = userInfo.deleted
                                    ? ` ${DELETED_USER_MSG}`
                                    : '';
                                tooltip = displayName + deletedMessage;
                            }

                            return {
                                uid: viewerInfo.uid,
                                tooltip,
                                isOnline: viewerInfo.online,
                            };
                        })}
                    extraCount={extraViewersCount}
                />
            );

            const accessRequestsByUidLength =
                Object.keys(accessRequestsByUid).length;
            const shareButtonDOM = (
                <Button
                    className="viewers-badge-share-button"
                    icon={dataDoc.public ? 'Users' : 'Lock'}
                    title="Share"
                    pushable
                    ping={
                        !readonly && accessRequestsByUidLength > 0
                            ? accessRequestsByUidLength.toString()
                            : null
                    }
                    aria-label={
                        !readonly && accessRequestsByUidLength > 0
                            ? `${accessRequestsByUidLength} Access Request${
                                  accessRequestsByUidLength === 1 ? '' : 's'
                              }`
                            : null
                    }
                    data-balloon-pos="left"
                />
            );

            return (
                <div
                    className="viewers-badge-viewers"
                    onClick={() => {
                        trackClick({
                            component: ComponentType.DATADOC_PAGE,
                            element: ElementType.SHARE_DATADOC_BUTTON,
                        });
                        setShowViewsList((v) => !v);
                    }}
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

import * as React from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import {
    Permission,
    permissionToReadWrite,
} from 'lib/data-doc/datadoc-permission';
import {
    addBoardAccessRequest,
    addBoardEditors,
    deleteBoardEditor,
    rejectBoardAccessRequest,
    updateBoard,
    updateBoardEditors,
    updateBoardOwner,
} from 'redux/board/action';
import {
    boardEditorInfosSelector,
    currentBoardAccessRequestsByUidSelector,
} from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { ViewersList } from 'ui/ViewersList/ViewersList';

interface IProps {
    boardId: number;
    isEditable: boolean;
}

export const BoardViewersList: React.FunctionComponent<IProps> = ({
    boardId,
    isEditable,
}) => {
    const dispatch: Dispatch = useDispatch();

    const {
        board,
        editorsByUid,
        editorInfos,
        currentUserId,
        accessRequestsByUid,
    } = useSelector((state: IStoreState) => ({
        board: state.board.boardById[boardId],
        editorsByUid: state.board.editorsByBoardIdUserId[boardId],
        editorInfos: boardEditorInfosSelector(state),
        currentUserId: state.user.myUserInfo.uid,
        accessRequestsByUid: currentBoardAccessRequestsByUidSelector(state),
    }));

    const isOwner = React.useMemo(
        () => board.owner_uid === currentUserId,
        [board.owner_uid, currentUserId]
    );

    const handlePublicToggle = React.useCallback(
        (selectedTabKey) => {
            dispatch(
                updateBoard(
                    board.id,
                    board.name,
                    selectedTabKey === 'Public',
                    board.description
                )
            );
        },
        [board, dispatch]
    );

    const addBoardEditor = React.useCallback(
        (uid: number, permission: Permission) => {
            dispatch(addBoardEditors(board.id, uid, permission));
        },
        [board.id]
    );
    const rejectAccessRequest = React.useCallback(
        (uid: number) => {
            dispatch(rejectBoardAccessRequest(board.id, uid));
        },
        [board.id]
    );
    const handleBoardAccessRequest = React.useCallback(() => {
        dispatch(addBoardAccessRequest(board.id));
    }, [board.id]);

    const handleUserSelect = React.useCallback(
        (uid: number) => {
            if (uid in editorsByUid || uid === board.owner_uid) {
                toast.error('User already added.');
            } else {
                const newUserPermission = board.public
                    ? Permission.CAN_WRITE
                    : Permission.CAN_READ;
                dispatch(addBoardEditors(board.id, uid, newUserPermission));
            }
        },
        [board, editorsByUid]
    );

    const editorInfosToShow = board.public
        ? editorInfos.filter(
              (viewer) => viewer.permission !== Permission.CAN_READ
          )
        : editorInfos;

    const handleRemoveEditor = React.useCallback(
        (uid: number) => {
            if (uid in editorsByUid) {
                dispatch(deleteBoardEditor(board.id, uid));
            }
        },
        [board.id, editorsByUid]
    );

    const handlePermissionChange = React.useCallback(
        (permission: Permission, uid: number) => {
            if (permission === Permission.OWNER) {
                dispatch(updateBoardOwner(board.id, uid));
            } else {
                const { read, write } = permissionToReadWrite(permission);
                if (uid in editorsByUid) {
                    dispatch(updateBoardEditors(board.id, uid, read, write));
                } else {
                    dispatch(addBoardEditors(board.id, uid, permission));
                }
            }
        },
        [board.id, editorsByUid]
    );

    return (
        <ViewersList
            entityType={'list'}
            readonly={!isEditable}
            isPublic={board.public}
            onPublicToggle={handlePublicToggle}
            onAccessRequest={handleBoardAccessRequest}
            onUserSelect={handleUserSelect}
            infoToShow={editorInfosToShow}
            onPermissionChange={handlePermissionChange}
            accessRequestsByUid={accessRequestsByUid}
            onRemoveEditor={handleRemoveEditor}
            addEditor={addBoardEditor}
            rejectAccessRequest={rejectAccessRequest}
            isOwner={isOwner}
        />
    );
};

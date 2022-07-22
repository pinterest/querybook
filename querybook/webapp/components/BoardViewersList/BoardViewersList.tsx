import * as React from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import {
    Permission,
    permissionToReadWrite,
} from 'lib/data-doc/datadoc-permission';
import {
    addBoardAccessRequest,
    addBoardEditor,
    deleteBoardEditor,
    rejectBoardAccessRequest,
    updateBoard,
    updateBoardEditor,
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
    } = useShallowSelector((state: IStoreState) => ({
        board: state.board.boardById[boardId],
        editorsByUid: state.board.editorsByBoardIdUserId[boardId],
        editorInfos: boardEditorInfosSelector(state, boardId),
        currentUserId: state.user.myUserInfo.uid,
        accessRequestsByUid: currentBoardAccessRequestsByUidSelector(
            state,
            boardId
        ),
    }));

    const isOwner = board.owner_uid === currentUserId;

    const handlePublicToggle = React.useCallback(
        (isPublic) => {
            dispatch(
                updateBoard(board.id, board.name, isPublic, board.description)
            );
        },
        [board, dispatch]
    );

    const addBoardEditorAction = React.useCallback(
        (uid: number, permission: Permission) => {
            dispatch(addBoardEditor(board.id, uid, permission));
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
                dispatch(addBoardEditor(board.id, uid, newUserPermission));
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
                    dispatch(updateBoardEditor(board.id, uid, read, write));
                } else {
                    dispatch(addBoardEditor(board.id, uid, permission));
                }
            }
        },
        [board.id, editorsByUid]
    );

    return (
        <ViewersList
            entityName="list"
            readonly={!isEditable}
            isPublic={board.public}
            onPublicToggle={handlePublicToggle}
            onAccessRequest={handleBoardAccessRequest}
            onUserSelect={handleUserSelect}
            infoToShow={editorInfosToShow}
            onPermissionChange={handlePermissionChange}
            accessRequestsByUid={accessRequestsByUid}
            onRemoveEditor={handleRemoveEditor}
            addEditor={addBoardEditorAction}
            rejectAccessRequest={rejectAccessRequest}
            isOwner={isOwner}
        />
    );
};

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    boardId: number;
    itemId: number;
    docId: number;
    isCollapsed: boolean;
    isEditMode: boolean;
}

export const BoardDataDocItem: React.FunctionComponent<IProps> = ({
    boardId,
    itemId,
    docId,
    isCollapsed,
    isEditMode,
}) => {
    const doc = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocById[docId]
    );

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchDataDocIfNeeded(docId));
    }, [docId]);

    return doc ? (
        <BoardItem
            boardId={boardId}
            boardItemId={itemId}
            itemId={docId}
            itemType="data_doc"
            title={doc.title}
            titleUrl={`/datadoc/${doc.id}/`}
            defaultCollapsed={isCollapsed}
            isEditMode={isEditMode}
        />
    ) : null;
};

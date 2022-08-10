import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    itemId: number;
    docId: number;
}

export const BoardDataDocItem: React.FunctionComponent<IProps> = ({
    itemId,
    docId,
}) => {
    const doc = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocById[docId]
    );

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchDataDocIfNeeded(docId));
    }, [dispatch, docId]);

    return doc ? (
        <BoardItem
            boardItemId={itemId}
            itemId={docId}
            itemType="data_doc"
            title={doc.title}
            titleUrl={`/datadoc/${doc.id}/`}
            authorUid={doc.owner_uid}
            updatedAt={doc.updated_at}
        />
    ) : null;
};

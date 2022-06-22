import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, IStoreState } from 'redux/store/types';
import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';

import { BoardItem } from './BoardItem';

interface IProps {
    docId: number;
    isCollapsed: boolean;
    isEditMode: boolean;
}

export const BoardDataDocItem: React.FunctionComponent<IProps> = ({
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

    // TODO - meowcodes: add notesDOM
    return (
        <BoardItem
            itemId={docId}
            itemType="data_doc"
            title={doc.title}
            titleUrl={`/datadoc/${doc.id}/`}
            notesDOM={null}
            defaultCollapsed={isCollapsed}
            isEditMode={isEditMode}
        />
    );
};

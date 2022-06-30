import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQueryExecutionIfNeeded } from 'redux/queryExecutions/action';
import { queryExecutionSelector } from 'redux/queryExecutions/selector';
import { IStoreState } from 'redux/store/types';
import { BoardItem } from './BoardItem';

interface IProps {
    boardId: number;
    itemId: number;
    queryExecutionId: number;
    isCollapsed: boolean;
    isEditMode: boolean;
}

export const BoardQueryItem: React.FunctionComponent<IProps> = ({
    boardId,
    itemId,
    queryExecutionId,
    isCollapsed,
    isEditMode,
}) => {
    const dispatch = useDispatch();
    const queryExecution = useSelector((state: IStoreState) =>
        queryExecutionSelector(state, queryExecutionId)
    );

    React.useEffect(() => {
        dispatch(fetchQueryExecutionIfNeeded(queryExecutionId));
    }, [queryExecutionId]);

    return queryExecution ? (
        <BoardItem
            boardId={boardId}
            boardItemId={itemId}
            itemId={queryExecution.id}
            itemType="query"
            title={`Execution ${queryExecution.id}`}
            titleUrl={`/query_execution/${queryExecution.id}/`}
            defaultCollapsed={isCollapsed}
            isEditMode={isEditMode}
        />
    ) : null;
};

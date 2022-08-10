import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchQueryExecutionIfNeeded } from 'redux/queryExecutions/action';
import { queryExecutionSelector } from 'redux/queryExecutions/selector';
import { IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    itemId: number;
    queryExecutionId: number;
}

export const BoardQueryItem: React.FunctionComponent<IProps> = ({
    itemId,
    queryExecutionId,
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
            boardItemId={itemId}
            itemId={queryExecution.id}
            itemType="query"
            title={`Execution ${queryExecution.id}`}
            titleUrl={`/query_execution/${queryExecution.id}/`}
            authorUid={queryExecution.uid}
            updatedAt={queryExecution.completed_at}
        />
    ) : null;
};

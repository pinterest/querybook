import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as queryExecutionsSelector from 'redux/queryExecutions/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState } from 'redux/store/types';
import { QueryViewEditor } from './QueryViewEditor';
import { QueryViewExecution } from './QueryViewExecution';
import './QueryView.scss';
import { Loading } from 'ui/Loading/Loading';
import { Container } from 'ui/Container/Container';

interface IProps {
    queryId: number;
}

export const QueryView: React.FunctionComponent<IProps> = ({ queryId }) => {
    const dispatch = useDispatch();
    const queryExecution = useSelector((state: IStoreState) =>
        queryExecutionsSelector.queryExecutionSelector(state, queryId)
    );

    React.useEffect(() => {
        dispatch(queryExecutionsActions.fetchQueryExecutionIfNeeded(queryId));
    }, [queryId]);

    return queryExecution ? (
        <Container className="QueryView">
            <QueryViewEditor queryExecution={queryExecution} />
            <QueryViewExecution queryExecution={queryExecution} />
        </Container>
    ) : (
        <Loading />
    );
};

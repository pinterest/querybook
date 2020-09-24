import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as queryExecutionsSelector from 'redux/queryExecutions/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState } from 'redux/store/types';
import { QueryViewEditor } from './QueryViewEditor';
import { QueryViewExecution } from './QueryViewExecution';
import './QueryView.scss';
import { Loading } from 'ui/Loading/Loading';
import { Container } from 'ui/Container/Container';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { Loader } from 'ui/Loader/Loader';
import { formatError } from 'lib/utils/error';

interface IProps {
    queryId: number;
}

export const QueryView: React.FunctionComponent<IProps> = ({ queryId }) => {
    const dispatch = useDispatch();
    const queryExecution = useSelector((state: IStoreState) =>
        queryExecutionsSelector.queryExecutionSelector(state, queryId)
    );

    const handleQueryExecutionAccessRequest = React.useCallback(() => {
        dispatch(
            queryExecutionsActions.addQueryExecutionAccessRequest(queryId)
        );
    }, [queryId]);

    const fetchQueryExecution = React.useCallback(
        () =>
            dispatch(
                queryExecutionsActions.fetchQueryExecutionIfNeeded(queryId)
            ),
        [queryExecution]
    );

    const errorPage = (error) => {
        if (error.response.status === 403) {
            return (
                <ErrorPage
                    errorTitle="Access Denied"
                    errorMessage="You do not have access to this query execution"
                >
                    <AccessRequestButton
                        onAccessRequest={handleQueryExecutionAccessRequest}
                    />
                </ErrorPage>
            );
        } else {
            return <ErrorPage errorMessage={formatError(error)} />;
        }
    };

    return (
        <Container className="QueryView">
            <Loader
                item={queryExecution}
                itemKey={queryId}
                itemLoader={fetchQueryExecution}
                errorRenderer={(error) => errorPage(error)}
            >
                <>
                    <QueryViewEditor queryExecution={queryExecution} />
                    <QueryViewExecution queryExecution={queryExecution} />
                </>
            </Loader>
        </Container>
    );
};

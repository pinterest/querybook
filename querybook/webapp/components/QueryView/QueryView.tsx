import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { formatError } from 'lib/utils/error';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import * as queryExecutionsSelector from 'redux/queryExecutions/selector';
import { IStoreState } from 'redux/store/types';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { Loader } from 'ui/Loader/Loader';

import { QueryViewEditor } from './QueryViewEditor';
import { QueryViewExecution } from './QueryViewExecution';

import './QueryView.scss';

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
        if (error?.response?.status === 403) {
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
        <div className="QueryView">
            <Loader
                item={queryExecution}
                itemKey={queryId}
                itemLoader={fetchQueryExecution}
                errorRenderer={(error) => errorPage(error)}
            >
                <QueryViewEditor queryExecution={queryExecution} />
                <QueryViewExecution queryExecution={queryExecution} />
            </Loader>
        </div>
    );
};

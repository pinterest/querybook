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

interface IProps {
    queryId: number;
}

export const QueryView: React.FunctionComponent<IProps> = ({ queryId }) => {
    const dispatch = useDispatch();
    const queryExecution = useSelector((state: IStoreState) =>
        queryExecutionsSelector.queryExecutionSelector(state, queryId)
    );
    const [errorObj, setErrorObj] = useState(null);
    React.useEffect(() => {
        setErrorObj(null);
        dispatch(queryExecutionsActions.fetchQueryExecution(queryId)).catch(
            (error) => {
                if (error.response.status == 403) {
                    setErrorObj(error);
                }
            }
        );
    }, [queryId]);

    const handleQueryExecutionAccessRequest = React.useCallback(() => {
        dispatch(
            queryExecutionsActions.addQueryExecutionAccessRequest(queryId)
        );
    }, [queryId]);

    const errorPage = (
        <ErrorPage
            errorTitle="Access Denied"
            errorMessage="You do not have access to this query execution"
        >
            <AccessRequestButton
                onAccessRequest={handleQueryExecutionAccessRequest}
            />
        </ErrorPage>
    );

    return errorObj || queryExecution ? (
        <Container className="QueryView">
            {errorObj ? (
                errorPage
            ) : (
                <>
                    <QueryViewEditor queryExecution={queryExecution} />
                    <QueryViewExecution queryExecution={queryExecution} />
                </>
            )}
        </Container>
    ) : (
        <Loading />
    );
};

import * as React from 'react';
import { Dispatch } from 'redux/store/types';
import { useDispatch } from 'react-redux';
import { AxiosError } from 'axios';

import * as dataDocActions from 'redux/dataDoc/action';

import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

export const DataDocError: React.FunctionComponent<{
    errorObj: AxiosError;
    docId: number;
}> = React.memo(({ docId, errorObj }) => {
    let errorTitle: string;
    let errorContent: React.ReactNode;
    let errorMessage: string;
    const dispatch: Dispatch = useDispatch();

    const handleDataDocAccessRequest = React.useCallback(() => {
        dispatch(dataDocActions.addDataDocAccessRequest(docId));
    }, [docId]);

    // network request fail
    errorTitle = `${errorObj.response.status}: ${errorObj.response.statusText}`;

    if (errorObj.response.data) {
        // failed due to api exception
        const exceptionMessage = errorObj.response.data.error;
        if (exceptionMessage === 'CANNOT_READ_DATADOC') {
            errorTitle = 'Access Denied';
            errorMessage = 'You cannot read this DataDoc';
            errorContent = (
                <AccessRequestButton
                    onAccessRequest={handleDataDocAccessRequest}
                />
            );
        } else if (exceptionMessage === 'DOC_DNE') {
            errorTitle = 'Invalid DataDoc';
            errorMessage = 'This DataDoc does not exist';
        } else {
            errorMessage = exceptionMessage;
        }
    }

    return (
        <ErrorPage errorTitle={errorTitle} errorMessage={errorMessage}>
            {errorContent}
        </ErrorPage>
    );
});

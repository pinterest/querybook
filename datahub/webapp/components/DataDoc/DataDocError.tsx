import * as React from 'react';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import * as dataDocActions from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';
import { useDispatch } from 'react-redux';
import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';

export const DataDocError: React.FunctionComponent<{
    errorObj: any;
    docId: number;
}> = React.memo(({ docId, errorObj }) => {
    let errorTitle: string;
    let errorContent: React.ReactNode;
    let errorMessage: string;
    const dispatch: Dispatch = useDispatch();

    const handleDataDocAccessRequest = React.useCallback(() => {
        dispatch(dataDocActions.addDataDocAccessRequest(docId));
    }, [docId]);

    if (errorObj) {
        if (errorObj.response) {
            // network request fail
            errorTitle = `${errorObj.response.status}: ${errorObj.response.statusText}`;

            if (errorObj.response.data) {
                // failed due to api exception
                const exceptionMessage = errorObj.response.data.error;
                if (exceptionMessage === 'CANNOT_READ_DATADOC') {
                    errorTitle = 'Access Denied';
                    errorMessage = 'You cannot read this DataDoc.';
                    errorContent = (
                        <AccessRequestButton
                            onAccessRequest={handleDataDocAccessRequest}
                        />
                    );
                } else if (exceptionMessage === 'DOC_DNE') {
                    errorTitle = 'Invalid DataDoc';
                    errorMessage = 'This DataDoc does not exist.';
                } else {
                    errorMessage = exceptionMessage;
                }
            }
        }
    }

    return (
        <ErrorPage errorTitle={errorTitle} errorMessage={errorMessage}>
            {errorContent}
        </ErrorPage>
    );
});

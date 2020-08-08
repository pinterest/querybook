import * as React from 'react';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { AccessRequestPage } from 'ui/AccessRequestPage/AccessRequestPage';
import * as dataDocActions from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';
import { useDispatch } from 'react-redux';

export const DataDocError: React.FunctionComponent<{
    errorObj: any;
    docId: number;
    uid: number;
}> = React.memo(({ docId, errorObj, uid }) => {
    let errorTitle: string;
    let errorContent: any;
    let errorMessage: any;
    const dispatch: Dispatch = useDispatch();

    const handleDataDocAccessRequest = () =>
        dispatch(dataDocActions.addDataDocAccessRequest(docId, uid));

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
                        <AccessRequestPage
                            onAccessRequest={() => handleDataDocAccessRequest()}
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

import * as React from 'react';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

export const DataDocError: React.FunctionComponent<{
    errorObj: any;
}> = React.memo(({ errorObj }) => {
    let errorTitle: string;
    let errorContent: string;

    if (errorObj) {
        if (errorObj.response) {
            // network request fail
            errorTitle = `${errorObj.response.status}: ${errorObj.response.statusText}`;

            if (errorObj.response.data) {
                // failed due to api exception
                const exceptionMessage = errorObj.response.data.error;
                if (exceptionMessage === 'CANNOT_READ_DATADOC') {
                    errorTitle = 'Access Denied';
                    errorContent =
                        'You cannot read this DataDoc.\nPlease request access from the owner.';
                } else if (exceptionMessage === 'DOC_DNE') {
                    errorTitle = 'Invalid DataDoc';
                    errorContent = 'This DataDoc does not exist.';
                } else {
                    errorContent = exceptionMessage;
                }
            }
        }
    }

    return <ErrorPage errorTitle={errorTitle}>{errorContent}</ErrorPage>;
});

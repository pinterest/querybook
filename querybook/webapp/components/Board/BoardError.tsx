import type { AxiosError } from 'axios';
import * as React from 'react';

import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

export const BoardError: React.FunctionComponent<{
    errorObj: AxiosError;
    boardId: number;
}> = React.memo(({ boardId, errorObj }) => {
    let errorTitle: string;
    let errorMessage: string;

    // network request fail
    errorTitle = `${errorObj.response.status}: ${errorObj.response.statusText}`;

    if (errorObj.response.data) {
        // failed due to api exception
        const exceptionMessage = errorObj.response.data.error;
        if (exceptionMessage === 'CANNOT_READ_BOARD') {
            errorTitle = 'Access Denied';
            errorMessage = 'You cannot read this Board.';
        } else if (exceptionMessage === 'BOARD_DNE') {
            errorTitle = 'Invalid Board';
            errorMessage = 'This Board does not exist.';
        } else {
            errorMessage = exceptionMessage;
        }
    }

    return <ErrorPage errorTitle={errorTitle} errorMessage={errorMessage} />;
});

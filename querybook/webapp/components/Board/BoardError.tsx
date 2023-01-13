import * as React from 'react';
import { useDispatch } from 'react-redux';

import { AccessRequestButton } from 'components/AccessRequestButton/AccessRequestButton';
import { AxiosErrorWithMessage } from 'lib/utils/error';
import { addBoardAccessRequest } from 'redux/board/action';
import { Dispatch } from 'redux/store/types';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

export const BoardError: React.FunctionComponent<{
    errorObj: AxiosErrorWithMessage;
    boardId: number;
}> = React.memo(({ boardId, errorObj }) => {
    const dispatch: Dispatch = useDispatch();

    let errorTitle: string;
    let errorMessage: string;
    let accessRequestDOM: React.ReactNode;
    // network request fail
    errorTitle = `${errorObj.response.status}: ${errorObj.response.statusText}`;

    const handleBoardAccessRequest = React.useCallback(() => {
        dispatch(addBoardAccessRequest(boardId));
    }, [boardId]);

    if (errorObj.response.data) {
        // failed due to api exception
        const exceptionMessage = errorObj.response.data.error;
        if (exceptionMessage === 'CANNOT_READ_BOARD') {
            errorTitle = 'Access Denied';
            errorMessage = 'You cannot read this Board.';
            accessRequestDOM = (
                <AccessRequestButton
                    onAccessRequest={handleBoardAccessRequest}
                />
            );
        } else if (exceptionMessage === 'BOARD_DNE') {
            errorTitle = 'Invalid Board';
            errorMessage = 'This Board does not exist.';
        } else {
            errorMessage = exceptionMessage;
        }
    }

    return (
        <ErrorPage errorTitle={errorTitle} errorMessage={errorMessage}>
            {accessRequestDOM}
        </ErrorPage>
    );
});

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as datahubUIActions from 'redux/dataHubUI/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { ConfirmationMessage } from './ConfirmationMessage';

export const ConfirmationManager: React.FunctionComponent = () => {
    const confirmation = useSelector(
        (state: IStoreState) => state.dataHubUI.confirmation
    );
    const dispatch: Dispatch = useDispatch();

    const wrapOnConfirmationEnd = (callback?: () => any) => () => {
        dispatch(datahubUIActions.removeConfirmation());
        if (callback != null) {
            callback();
        }
    };

    if (confirmation == null) {
        return null;
    }

    const mergedProps = {
        ...confirmation,
        onConfirm: wrapOnConfirmationEnd(confirmation.onConfirm),
        onDismiss: wrapOnConfirmationEnd(confirmation.onDismiss),
        onHide: wrapOnConfirmationEnd(confirmation.onHide),
    };

    return <ConfirmationMessage {...mergedProps} />;
};

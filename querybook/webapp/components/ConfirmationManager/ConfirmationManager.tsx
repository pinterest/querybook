import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as querybookUIActions from 'redux/querybookUI/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { ConfirmationMessage } from './ConfirmationMessage';

export const ConfirmationManager: React.FunctionComponent = () => {
    const confirmation = useSelector(
        (state: IStoreState) => state.querybookUI.confirmation
    );
    const dispatch: Dispatch = useDispatch();

    const wrapOnConfirmationEnd = (callback?: () => any) => () => {
        dispatch(querybookUIActions.removeConfirmation());
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

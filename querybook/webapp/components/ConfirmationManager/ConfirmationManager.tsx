import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as querybookUIActions from 'redux/querybookUI/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { ConfirmationMessage } from './ConfirmationMessage';

export const ConfirmationManager: React.FunctionComponent = () => {
    const confirmation = useSelector(
        (state: IStoreState) => state.querybookUI.confirmation
    );
    const dispatch: Dispatch = useDispatch();

    const handleHide = useCallback(() => {
        dispatch(querybookUIActions.removeConfirmation());
        confirmation?.onHide?.();
    }, [confirmation, dispatch]);

    if (confirmation == null) {
        return null;
    }

    const mergedProps = {
        ...confirmation,
        onConfirm: confirmation.onConfirm,
        onDismiss: confirmation.onDismiss,
        onHide: handleHide,
    };

    return <ConfirmationMessage {...mergedProps} />;
};

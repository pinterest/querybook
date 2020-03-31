import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import history from 'lib/router-history';
import { TooltipDirection } from 'const/tooltip';
import * as dataDocActions from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';

export interface ICreateDataDocButtonProps {
    // from own Props
    tooltipPos?: TooltipDirection;
    tooltip?: string;
}

export const CreateDataDocButton: React.FunctionComponent<ICreateDataDocButtonProps> = ({
    tooltipPos = 'left',
    tooltip = 'New DataDoc',
}) => {
    const environment = useSelector(currentEnvironmentSelector);
    const dispatch: Dispatch = useDispatch();

    const handleCreateDataDoc = React.useCallback(() => {
        dispatch(dataDocActions.createDataDoc()).then((dataDoc) =>
            history.push(`/${environment.name}/datadoc/${dataDoc.id}/`)
        );
    }, [dispatch, environment]);

    return (
        <IconButton
            icon="plus"
            tooltip={tooltip}
            tooltipPos={tooltipPos}
            onClick={handleCreateDataDoc}
        />
    );
};

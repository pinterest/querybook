import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import history from 'lib/router-history';
import { TooltipDirection } from 'const/tooltip';
import * as dataDocActions from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { getQueryEngineId } from 'lib/utils';
import { queryEngineSelector } from 'redux/queryEngine/selector';

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
    const queryEngines = useSelector(queryEngineSelector);
    const defaultEngineId = useSelector((state: IStoreState) =>
        getQueryEngineId(
            state.user.computedSettings['default_query_engine'],
            queryEngines.map(({ id }) => id)
        )
    );
    const dispatch: Dispatch = useDispatch();

    const handleCreateDataDoc = React.useCallback(() => {
        const cell = {
            type: 'query',
            context: '',
            meta: { engine: defaultEngineId },
        };
        dispatch(dataDocActions.createDataDoc([cell])).then((dataDoc) =>
            history.push(`/${environment.name}/datadoc/${dataDoc.id}/`)
        );
    }, [environment]);

    return (
        <IconButton
            icon="plus"
            tooltip={tooltip}
            tooltipPos={tooltipPos}
            onClick={handleCreateDataDoc}
        />
    );
};

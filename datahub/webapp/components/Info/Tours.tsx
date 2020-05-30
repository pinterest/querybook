import * as React from 'react';
import Tour from 'reactour';

import { navigateWithinEnv } from 'lib/utils/query-string';

import { DataHubSidebarTourSteps } from 'components/UIGuide/DataHubSidebarUIGuide';
import { DataDocTourSteps } from 'components/UIGuide/DataDocUIGuide';

import { Title } from 'ui/Title/Title';
import { Card } from 'ui/Card/Card';

import './Tours.scss';
import * as dataDocActions from 'redux/dataDoc/action';

import history from 'lib/router-history';

import { useSelector, useDispatch } from 'react-redux';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getQueryEngineId } from 'lib/utils';

export const Tours: React.FunctionComponent = () => {
    const environment = useSelector(currentEnvironmentSelector);
    const queryEngines = useSelector(queryEngineSelector);
    const defaultEngineId = useSelector((state: IStoreState) =>
        getQueryEngineId(
            state.user.computedSettings['default_query_engine'],
            queryEngines.map(({ id }) => id)
        )
    );
    const dispatch: Dispatch = useDispatch();
    const handleDataDocTour = React.useCallback(() => {
        const cell = {
            type: 'query',
            context: '',
            meta: { engine: defaultEngineId },
        };
        dispatch(dataDocActions.createDataDoc([cell])).then((dataDoc) =>
            history.push(`/${environment.name}/datadoc/${dataDoc.id}/tour/`)
        );
    }, [environment]);

    return (
        <div className="Tours m12">
            <Title subtitle className="mb12">
                Welcome to DataHub Tours!
            </Title>
            <Title subtitle size={5}>
                Click on a card to start a tour
            </Title>
            <div className="Tours-cards flex-center mv24">
                <Card
                    title="DataHub Tour"
                    onClick={() => navigateWithinEnv('/tour/')}
                >
                    General overview of DataHub functionalities
                </Card>
                <Card title="DataDoc Tour" onClick={handleDataDocTour}>
                    Overview of DataDoc functionalities
                </Card>
            </div>
        </div>
    );
};

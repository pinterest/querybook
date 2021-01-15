import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as dataDocActions from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { queryEngineSelector } from 'redux/queryEngine/selector';

import history from 'lib/router-history';
import { getAppName } from 'lib/utils/global';
import { getQueryEngineId } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';

import { Title } from 'ui/Title/Title';
import { Card } from 'ui/Card/Card';

import './Tours.scss';

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
            history.push(
                `/${environment.name}/datadoc/${dataDoc.id}/?tour=true`
            )
        );
    }, [environment, defaultEngineId]);

    return (
        <div className="Tours m12">
            <Title subtitle className="mb12">
                Welcome to the {getAppName()} Tutorial!
            </Title>
            <Title subtitle size={5}>
                Click on a card to start the tutorial.
            </Title>
            <div className="Tours-cards flex-center mv24">
                <Card
                    title={`${getAppName()} Tour`}
                    onClick={() => navigateWithinEnv('/?tour=true')}
                >
                    General overview of {getAppName()} functionalities
                </Card>
                <Card title="DataDoc Tour" onClick={handleDataDocTour}>
                    Overview of DataDoc functionalities
                </Card>
            </div>
        </div>
    );
};

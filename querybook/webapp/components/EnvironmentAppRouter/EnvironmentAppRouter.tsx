import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { IEnvironment } from 'redux/environment/types';
import { loadQueryEngine } from 'redux/queryEngine/action';
import { fetchQueryMetastore } from 'redux/dataSources/action';
import { rehydrateAdhocQueryForEnvironment } from 'redux/adhocQuery/action';

import { Loading } from 'ui/Loading/Loading';
import { EnvironmentAppSidebar } from 'components/EnvironmentAppSidebar/EnvironmentAppSidebar';
import { EnvironmentModalSwitchRouter } from 'components/EnvironmentAppRouter/EnvironmentModalSwitchRouter';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './EnvironmentAppRouter.scss';

interface IProps {
    environment?: IEnvironment;
    selectEnvironment: (name: string) => any;
}

export const EnvironmentAppRouter: React.FunctionComponent<
    IProps & RouteComponentProps
> = ({ environment, match, selectEnvironment }) => {
    const envName: string = match.params['env'];

    const [envSelected, setEnvSelected] = React.useState(
        environment && environment.name === envName
    );
    const [engineLoaded, setEngineLoaded] = React.useState(false);
    const dispatch = useDispatch();
    React.useEffect(() => {
        if (environment?.name) {
            setEngineLoaded(false);
            Promise.all([
                dispatch(loadQueryEngine()),
                dispatch(fetchQueryMetastore()),
            ]).finally(() => {
                dispatch(rehydrateAdhocQueryForEnvironment(environment.id));
                setEngineLoaded(true);
            });
        }
    }, [environment?.name]);

    React.useEffect(() => {
        selectEnvironment(envName);
        setEnvSelected(true);

        return () => setEnvSelected(false);
    }, [envName, selectEnvironment]);

    if (!envSelected || !engineLoaded) {
        return <Loading />;
    }

    return (
        <FullHeight className="EnvironmentAppRouter" flex="row">
            <EnvironmentAppSidebar />
            <div className="EnvironmentAppRouter-content">
                <EnvironmentModalSwitchRouter />
            </div>
        </FullHeight>
    );
};

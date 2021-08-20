import * as React from 'react';
import { useDispatch } from 'react-redux';

import history from 'lib/router-history';
import { getAppName } from 'lib/utils/global';
import * as EnvironmentActions from 'redux/environment/action';

import { DemoResource } from 'resource/admin';
import { Card } from 'ui/Card/Card';
import { LoadingIcon } from 'ui/Loading/Loading';

import './SetUp.scss';

export const SetUp: React.FunctionComponent = () => {
    const [demoLoading, setDemoLoading] = React.useState<boolean>(false);

    const dispatch = useDispatch();

    const fetchEnvironments = () =>
        dispatch(EnvironmentActions.fetchEnvironments());

    const handleDemoSetUp = async () => {
        setDemoLoading(true);
        const resp = await DemoResource.setup();
        if (resp.data) {
            await fetchEnvironments();
            history.push(
                `/${resp.data.environment}/datadoc/${resp.data.data_doc_id}/`
            );
        } else {
            history.push('/admin/');
        }
    };

    return (
        <div className="SetUp flex-center">
            <div className="SetUp-message">Welcome to {getAppName()}!</div>
            <div className="SetUp-choices horizontal-space-between">
                {demoLoading ? (
                    <Card height="180px" width="240px">
                        <LoadingIcon />
                    </Card>
                ) : (
                    <Card
                        title={'Demo Set Up'}
                        onClick={handleDemoSetUp}
                        height="180px"
                        width="240px"
                    >
                        we'll set up a demo environment for you to get familiar
                        with the app
                    </Card>
                )}
                <Card
                    title="Detailed Set Up"
                    onClick={() => history.push('/admin/')}
                    height="180px"
                    width="240px"
                >
                    customize your configurations one step at a time
                </Card>
            </div>
        </div>
    );
};

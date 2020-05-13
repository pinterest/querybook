import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IStoreState } from 'redux/store/types';

import ds from 'lib/datasource';
import history from 'lib/router-history';
import * as EnvironmentActions from 'redux/environment/action';

import { Card } from 'ui/Card/Card';

import './SetUp.scss';

export const SetUp: React.FunctionComponent = () => {
    const { hasEnvironments } = useSelector((state: IStoreState) => {
        return {
            hasEnvironments:
                Object.keys(state.environment.environmentById).length > 0,
        };
    });
    const dispatch = useDispatch();

    const fetchEnvironments = () =>
        dispatch(EnvironmentActions.fetchEnvironments());

    const handleDemoSetUp = async () => {
        const resp = await ds.save('/admin/demo_set_up/', {});
        if (resp.data) {
            await fetchEnvironments();
            // await ds.save('/admin/demo_set_up_2/', {
            //     metastore_id: resp.data.metastore_id,
            //     task_schedule_id: resp.data.task_schedule_id,
            // });
            history.push(
                `/${resp.data.environment}/datadoc/${resp.data.data_doc_id}/`
            );
        } else {
            history.push('/admin/');
        }
    };

    return (
        <div className="SetUp flex-center">
            <div className="SetUp-message">Welcome to DataHub!</div>
            <div className="SetUp-choices horizontal-space-between">
                <Card
                    title="Demo Set Up"
                    onClick={handleDemoSetUp}
                    height="180px"
                    width="240px"
                >
                    we'll set up everything for you to get started
                </Card>
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

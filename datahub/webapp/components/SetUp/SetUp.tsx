import * as React from 'react';

import ds from 'lib/datasource';
import history from 'lib/router-history';

import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';

import './SetUp.scss';
import { Card } from 'ui/Card/Card';

export const SetUp: React.FunctionComponent = () => {
    const { hasEnvironments } = useSelector((state: IStoreState) => {
        return {
            hasEnvironments:
                Object.keys(state.environment.environmentById).length > 0,
        };
    });

    const handleOneClickSetUp = async () => {
        const resp = await ds.save('/admin/one_click_set_up/', {});
        if (resp.data) {
            history.push(`/${resp.data[0].name}`);
        } else {
            history.push('/admin/');
        }
    };

    return (
        <div className="SetUp flex-center">
            <div className="SetUp-message">Welcome to DataHub!</div>
            <div className="SetUp-choices horizontal-space-between">
                {hasEnvironments ? null : (
                    <Card
                        title="One-Click Set Up"
                        onClick={handleOneClickSetUp}
                        height="180px"
                        width="240px"
                    >
                        we'll set up everything for you to get started
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

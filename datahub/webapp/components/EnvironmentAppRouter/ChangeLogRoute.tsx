import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useModalRoute } from 'hooks/useModalRoute';

import { ChangeLog } from 'components/ChangeLog/ChangeLog';

import { Modal } from 'ui/Modal/Modal';
import localStore from 'lib/local-store';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';
import moment from 'moment';

export const ChangeLogRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    const isModal = useModalRoute(location);

    const handleHide = () => {
        localStore.set<ChangeLogValue>(
            CHANGE_LOG_KEY,
            moment().format('YYYY-MM-DD')
        );
        history.goBack();
    };

    return isModal ? (
        <Modal onHide={handleHide} title="Change Log" className="with-padding">
            <ChangeLog />
        </Modal>
    ) : (
        <div className="ChangeLogRoute m24">
            <ChangeLog />
        </div>
    );
};

import * as React from 'react';
import moment from 'moment';
import { RouteComponentProps } from 'react-router-dom';

import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';

import history from 'lib/router-history';
import localStore from 'lib/local-store';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';

import { ChangeLog } from 'components/ChangeLog/ChangeLog';

import { Modal } from 'ui/Modal/Modal';

const ChangeLogRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('Change Log');
    const isModal = useModalRoute(location);

    const handleHide = () => {
        localStore.set<ChangeLogValue>(
            CHANGE_LOG_KEY,
            moment().format('YYYY-MM-DD')
        );
        history.goBack();
    };

    return isModal ? (
        <Modal onHide={handleHide} title="Change Log">
            <ChangeLog />
        </Modal>
    ) : (
        <div className="ChangeLogRoute m24">
            <ChangeLog />
        </div>
    );
};

export default ChangeLogRoute;

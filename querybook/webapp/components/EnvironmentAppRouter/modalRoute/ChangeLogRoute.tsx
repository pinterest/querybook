import moment from 'moment';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { ChangeLog } from 'components/ChangeLog/ChangeLog';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import localStore from 'lib/local-store';
import { CHANGE_LOG_KEY, ChangeLogValue } from 'lib/local-store/const';
import history from 'lib/router-history';
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

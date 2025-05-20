import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { ChangeLog } from 'components/ChangeLog/ChangeLog';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { Modal } from 'ui/Modal/Modal';

const ChangeLogRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('Change Log');
    const isModal = useModalRoute(location);

    return isModal ? (
        <Modal onHide={history.goBack} title="Change Log">
            <ChangeLog />
        </Modal>
    ) : (
        <div className="ChangeLogRoute m24">
            <ChangeLog />
        </div>
    );
};

export default ChangeLogRoute;

import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useModalRoute } from 'hooks/useModalRoute';

import { ChangeLog } from 'components/ChangeLog/ChangeLog';

import { Modal } from 'ui/Modal/Modal';

export const ChangeLogRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    const isModal = useModalRoute(location);

    return isModal ? (
        <Modal
            onHide={isModal ? history.goBack : () => navigateWithinEnv('/')}
            title="Change Log"
            className="with-padding"
        >
            <ChangeLog />
        </Modal>
    ) : (
        <div className="ChangeLogRoute m24">
            <ChangeLog />
        </div>
    );
};

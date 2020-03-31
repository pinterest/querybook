import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import history from 'lib/router-history';
import { useModalRoute } from 'hooks/useModalRoute';

import { Modal } from 'ui/Modal/Modal';
import { QueryView } from 'components/QueryView/QueryView';

export const QueryExecutionRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
    match,
}) => {
    const isModal = useModalRoute(location);
    const contentDOM = <QueryView queryId={match.params['id']} />;

    return isModal ? (
        <Modal type="standard" onHide={history.goBack}>
            {contentDOM}
        </Modal>
    ) : (
        contentDOM
    );
};

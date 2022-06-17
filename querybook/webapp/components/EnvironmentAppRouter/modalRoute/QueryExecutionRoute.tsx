import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { QueryView } from 'components/QueryView/QueryView';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { Modal } from 'ui/Modal/Modal';

const QueryExecutionRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
    match,
}) => {
    const queryId = match.params['id'];
    useBrowserTitle('Query #' + queryId);
    const isModal = useModalRoute(location);
    const contentDOM = <QueryView queryId={queryId} />;

    return isModal ? (
        <Modal type="standard" onHide={history.goBack}>
            {contentDOM}
        </Modal>
    ) : (
        contentDOM
    );
};

export default QueryExecutionRoute;

import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { DataTableView } from 'components/DataTableView/DataTableView';
import { Modal } from 'ui/Modal/Modal';
import { useModalRoute } from 'hooks/useModalRoute';

const DataTableRoute: React.FunctionComponent<RouteComponentProps> = ({
    match,
    location,
}) => {
    const isModal = useModalRoute(location);
    const contentDOM = <DataTableView tableId={Number(match.params['id'])} />;

    return isModal ? (
        <Modal onHide={history.goBack} type="standard" className="wide">
            {contentDOM}
        </Modal>
    ) : (
        contentDOM
    );
};

export default DataTableRoute;

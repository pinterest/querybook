import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { DataTableView } from 'components/DataTableView/DataTableView';
import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { Modal } from 'ui/Modal/Modal';

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

import * as React from 'react';
import { RouteComponentProps, useParams } from 'react-router-dom';

import history from 'lib/router-history';
import { useModalRoute } from 'hooks/useModalRoute';

import { Modal } from 'ui/Modal/Modal';

export const InfoMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    const { date: infoType } = useParams();
    const isModal = useModalRoute(location);
    const contentDOM = null;

    return isModal ? (
        <Modal onHide={history.goBack} title="Info" className="with-padding">
            {contentDOM}
        </Modal>
    ) : (
        contentDOM
    );
};

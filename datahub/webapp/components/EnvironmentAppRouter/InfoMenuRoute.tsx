import * as React from 'react';
import { RouteComponentProps, useParams } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useModalRoute } from 'hooks/useModalRoute';

import { FAQ } from 'components/Info/FAQ';
import { Shortcut } from 'components/Info/Shortcut';
import { Tip } from 'components/Info/Tip';

import { Modal } from 'ui/Modal/Modal';

export const InfoMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    const { type: infoType } = useParams();
    const isModal = useModalRoute(location);

    const getContentDOM = () => {
        switch (infoType) {
            case 'shortcut':
                return <Shortcut />;
            case 'tip':
                return <Tip />;
            case 'faq':
                return <FAQ />;
            default:
                navigateWithinEnv('/');
        }
    };

    const title =
        infoType === 'shortcut'
            ? 'Keyboard Shortcuts'
            : infoType === 'tip'
            ? 'DataHub Tips'
            : 'Frequently Asked Questions';

    return isModal ? (
        <Modal onHide={history.goBack} title={title} className="with-padding">
            {getContentDOM()}
        </Modal>
    ) : (
        <div className="InfoMenuRoute m24">{getContentDOM()}</div>
    );
};

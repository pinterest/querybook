import * as React from 'react';
import { RouteComponentProps, useParams } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useModalRoute } from 'hooks/useModalRoute';
import { useBrowserTitle } from 'hooks/useBrowserTitle';

import { FAQ } from 'components/Info/FAQ';
import { Shortcut } from 'components/Info/Shortcut';
import { Tours } from 'components/Info/Tours';

import { Modal } from 'ui/Modal/Modal';

export const InfoMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('Info');
    const { type: infoType } = useParams();
    const isModal = useModalRoute(location);

    const getContentDOM = () => {
        switch (infoType) {
            case 'shortcut':
                return <Shortcut />;
            case 'tour':
                return <Tours />;
            case 'faq':
                return <FAQ />;
            default:
                navigateWithinEnv('/');
        }
    };

    const title =
        infoType === 'shortcut'
            ? 'Keyboard Shortcuts'
            : infoType === 'tour'
            ? 'Querybook Tutorials'
            : 'Frequently Asked Questions';

    return isModal ? (
        <Modal onHide={history.goBack} title={title} className="with-padding">
            {getContentDOM()}
        </Modal>
    ) : (
        <div className="InfoMenuRoute m24">{getContentDOM()}</div>
    );
};

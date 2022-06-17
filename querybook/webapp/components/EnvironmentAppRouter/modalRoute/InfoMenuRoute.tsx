import * as React from 'react';
import { RouteComponentProps, useParams } from 'react-router-dom';

import { FAQ } from 'components/Info/FAQ';
import { Shortcut } from 'components/Info/Shortcut';
import { Tours } from 'components/Info/Tours';
import {
    TemplateGuide,
    TemplateGuideModal,
} from 'components/TemplateGuide/TemplateGuide';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Modal } from 'ui/Modal/Modal';

const InfoMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
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
            case 'templating':
                return <TemplateGuide />;
            default:
                navigateWithinEnv('/');
        }
    };

    const title =
        infoType === 'shortcut'
            ? 'Keyboard Shortcuts'
            : infoType === 'tour'
            ? 'Tutorials'
            : infoType === 'faq'
            ? 'Frequently Asked Questions'
            : 'Template Guide';

    return isModal ? (
        infoType === 'templating' ? (
            <TemplateGuideModal onHide={history.goBack} />
        ) : (
            <Modal onHide={history.goBack} title={title}>
                {getContentDOM()}
            </Modal>
        )
    ) : (
        <div className="InfoMenuRoute m24">{getContentDOM()}</div>
    );
};

export default InfoMenuRoute;

import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { Modal } from 'ui/Modal/Modal';

import { QuerySnippetWrapper } from './QuerySnippetWrapper';

const QuerySnippetRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
    match,
}) => {
    const isModal = useModalRoute(location);
    const contentDOM = <QuerySnippetWrapper id={match.params['id']} />;

    return isModal ? (
        <Modal type="standard" onHide={history.goBack} title="Query Snippet">
            {contentDOM}
        </Modal>
    ) : (
        contentDOM
    );
};

export default QuerySnippetRoute;

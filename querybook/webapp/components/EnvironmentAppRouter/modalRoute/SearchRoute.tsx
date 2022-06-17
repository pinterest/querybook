import React from 'react';
import { useDispatch } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { SearchOverview } from 'components/Search/SearchOverview';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import history from 'lib/router-history';
import { mapQueryParamToState as mapQueryParamToStateAction } from 'redux/search/action';
import { Modal } from 'ui/Modal/Modal';

const SearchRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('Search');
    const dispatch = useDispatch();
    const mapQueryParamToState = React.useCallback(
        () => dispatch(mapQueryParamToStateAction()),
        []
    );

    const isModal = useModalRoute(location);
    React.useLayoutEffect(() => {
        if (!isModal) {
            mapQueryParamToState();
        }
    }, []);

    const contentDOM = <SearchOverview />;

    return isModal ? (
        <Modal
            type="custom"
            onHide={history.goBack}
            className="SearchModal no-scroll fullscreen"
            title={null}
        >
            <div className="Modal-box">{contentDOM}</div>
        </Modal>
    ) : (
        contentDOM
    );
};

export default SearchRoute;

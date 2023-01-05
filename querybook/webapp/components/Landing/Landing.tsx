import { sample } from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';

import { QuerybookSidebarUIGuide } from 'components/UIGuide/QuerybookSidebarUIGuide';
import { ComponentType } from 'const/analytics';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useTrackView } from 'hooks/useTrackView';
import { titleize } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { fetchDataDocs } from 'redux/dataDoc/action';
import {
    favoriteDataDocsSelector,
    recentDataDocsSelector,
} from 'redux/dataDoc/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IStoreState } from 'redux/store/types';
import { Column, Columns } from 'ui/Column/Column';

import './Landing.scss';

const querybookHints: string[] = require('config/loading_hints.yaml').hints;

const DefaultLanding: React.FC = ({ children }) => {
    const { userInfo, recentDataDocs, favoriteDataDocs, environment } =
        useShallowSelector((state: IStoreState) => {
            const recentDataDocsFromState = recentDataDocsSelector(state);
            const favoriteDataDocsFromState = favoriteDataDocsSelector(
                state
            ).slice(0, 5);
            return {
                userInfo: state.user.userInfoById[state.user.myUserInfo.uid],
                recentDataDocs: recentDataDocsFromState,
                favoriteDataDocs: favoriteDataDocsFromState,
                environment: currentEnvironmentSelector(state),
            };
        });

    const dispatch = useDispatch();
    React.useEffect(() => {
        dispatch(fetchDataDocs('favorite'));
        dispatch(fetchDataDocs('recent'));
    }, [environment.id]);

    const onDataDocClick = React.useCallback((docId) => {
        navigateWithinEnv(`/datadoc/${docId}/`);
    }, []);

    const getRecentDOM = () =>
        recentDataDocs.map((dataDoc) => (
            <div
                className="Landing-data-doc"
                onClick={() => onDataDocClick(dataDoc.id)}
                key={dataDoc.id}
            >
                {dataDoc.title || 'Untitled'}
            </div>
        ));
    const getFavoriteDOM = () =>
        favoriteDataDocs.map((dataDoc) => (
            <div
                className="Landing-data-doc"
                onClick={() => onDataDocClick(dataDoc.id)}
                key={dataDoc.id}
            >
                {dataDoc.title || 'Untitled'}
            </div>
        ));

    const [hint] = React.useState(sample(querybookHints));

    const LandingHeader = (
        <div className="Landing-top horizontal-space-between">
            <div>
                <div className="Landing-greeting">
                    Hi {titleize(userInfo.fullname || userInfo.username)},
                </div>
                <div className="Landing-subtitle">
                    Welcome back to Querybook
                </div>
            </div>
            <QuerybookSidebarUIGuide />
        </div>
    );

    const LandingFooter = (
        <div className="Landing-bottom">
            <Columns>
                <Column>
                    <div className="Landing-section-title">Did you know?</div>
                    <p>{hint}</p>
                </Column>
            </Columns>
            <Columns>
                <Column>
                    <div className="Landing-section-title">Recent DataDocs</div>
                    <div className="Landing-list">{getRecentDOM()}</div>
                </Column>
                <Column>
                    <div className="Landing-section-title">
                        Favorite DataDocs
                    </div>
                    <div className="Landing-list">{getFavoriteDOM()}</div>
                </Column>
            </Columns>
        </div>
    );

    return (
        <div className="Landing flex-column">
            {LandingHeader}
            <div className="Landing-middle">{children}</div>
            {LandingFooter}
        </div>
    );
};

const Landing: React.FC = () => {
    useTrackView(ComponentType.LANDING_PAGE);
    useBrowserTitle();

    const customLandingConfig = window.CUSTOM_LANDING_PAGE;
    if (customLandingConfig?.mode === 'replace') {
        return customLandingConfig.renderer();
    }

    return <DefaultLanding>{customLandingConfig?.renderer()}</DefaultLanding>;
};

export default Landing;

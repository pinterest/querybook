import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sample } from 'lodash';

import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { titleize } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { IStoreState } from 'redux/store/types';
import { fetchDataDocs } from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import {
    recentDataDocsSelector,
    favoriteDataDocsSelector,
} from 'redux/dataDoc/selector';

import { QuerybookSidebarUIGuide } from 'components/UIGuide/QuerybookSidebarUIGuide';

import { Columns, Column } from 'ui/Column/Column';
import { QuerybookLogo } from 'ui/QuerybookLogo/QuerybookLogo';
import { Title } from 'ui/Title/Title';

import './Landing.scss';

const querybookHints: string[] = require('config/loading_hints.yaml').hints;

const DefaultLanding: React.FC = ({ children }) => {
    const {
        userInfo,
        recentDataDocs,
        favoriteDataDocs,
        environment,
    } = useSelector((state: IStoreState) => {
        const recentDataDocsFromState = recentDataDocsSelector(state);
        const favoriteDataDocsFromState = favoriteDataDocsSelector(state).slice(
            0,
            5
        );
        return {
            userInfo: state.user.userInfoById[state.user.myUserInfo.uid],
            recentDataDocs: recentDataDocsFromState,
            favoriteDataDocs: favoriteDataDocsFromState,
            environment: currentEnvironmentSelector(state),
        };
    });
    const descriptionDOM = 'Data made simple.';

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
        <div className="Landing-top">
            <div className="Landing-greeting">
                Hi {titleize(userInfo.fullname || userInfo.username)}, welcome
                to
            </div>
            <div className="Landing-logo">
                <QuerybookLogo size={5} />
            </div>
            <div className="Landing-desc">{descriptionDOM}</div>
        </div>
    );

    const LandingFooter = (
        <div className="Landing-bottom">
            <Columns>
                <Column>
                    <QuerybookSidebarUIGuide />
                </Column>
            </Columns>
            <Columns>
                <Column>
                    <Title size={5} weight={'bold'}>
                        Did you know?
                    </Title>
                    <p>{hint}</p>
                </Column>
            </Columns>
            <Columns>
                <Column>
                    <Title weight={'bold'} size={5}>
                        Recent DataDocs
                    </Title>
                    <div className="Landing-list">{getRecentDOM()}</div>
                </Column>
                <Column>
                    <Title weight={'bold'} size={5}>
                        Favorite DataDocs
                    </Title>
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

export const Landing: React.FC = () => {
    useBrowserTitle();

    const customLandingConfig = window.CUSTOM_LANDING_PAGE;
    if (customLandingConfig?.mode === 'replace') {
        return customLandingConfig.renderer();
    }

    return <DefaultLanding>{customLandingConfig?.renderer()}</DefaultLanding>;
};

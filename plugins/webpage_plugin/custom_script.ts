// Place your custom css/js logic here
import React from 'react';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';
import { Title } from 'ui/Title/Title';
import styled from 'styled-components';
import { useInterval } from 'hooks/useInterval';
import { Dispatch } from 'redux/store/types';
import * as querybookUIActions from 'redux/querybookUI/action';
import { useDispatch } from 'react-redux';
import { Markdown } from 'ui/Markdown/Markdown';

interface IColumnDetector {
    type: string;
    priority: number;
    checker: (colName: string, values: any[]) => boolean;
}

interface IColumnStatsAnalyzer {
    key: string;
    name: string;
    appliesToType: string[];
    generator: (values: any[]) => string;
}

interface IColumnTransformer {
    key: string;
    name: string;

    appliesToType: string[];
    priority: number;
    auto: boolean;

    transform: (v: any) => React.ReactNode;
}

// Use the following definitions to override default Querybook
// behavior
declare global {
    /* tslint:disable:interface-name */
    interface Window {
        // Users will see this message if they cannot
        // access any
        NO_ENVIRONMENT_MESSAGE?: string;
        CUSTOM_LANDING_PAGE?: {
            // Two modes of custom landing page
            // replace: replace the entire landing page with custom content
            // not specified: add the custom content to the middle of the
            //                landing page
            mode?: 'replace';
            renderer: () => React.ReactElement;
        };
        CUSTOM_COLUMN_STATS_ANALYZERS?: IColumnStatsAnalyzer[];
        CUSTOM_COLUMN_DETECTORS?: IColumnDetector[];
        CUSTOM_COLUMN_TRANSFORMERS?: IColumnTransformer[];
        CUSTOM_KEY_MAP?: Record<
            string,
            Record<string, { key?: string; name?: string }>
        >;
    }
}

const NotificationItem = styled.div`
    border: 1px solid var(--icon-color);
    border-left: 5px solid var(--icon-color);
    padding: 4px 12px;
    margin: 12px;
`;

const NotificationItemsStyled = styled.div`
    max-width: 960px;
`;

window.CUSTOM_LANDING_PAGE = {
    mode: 'replace',
    renderer: () => {
        const dispatch: Dispatch = useDispatch();
        const loadAnnouncements = () =>
            dispatch(querybookUIActions.loadAnnouncements());

        React.useEffect(() => {
            loadAnnouncements();
        }, []);
        const announcements = useAnnouncements();
        console.log(announcements, 'announcement');

        useInterval(loadAnnouncements, 300000);

        return (
            <NotificationItemsStyled>
                <Title className="ml12">Environment announcements</Title>
                {announcements?.map((announcement) => (
                    <NotificationItem key={announcement.id}>
                        <Title subtitle size={7} className="query-context mb4">
                            <Markdown>{announcement.message}</Markdown>
                        </Title>
                    </NotificationItem>
                ))}
            </NotificationItemsStyled>
        );
    },
};

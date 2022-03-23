import React from 'react';
import { useDispatch } from 'react-redux';
import * as querybookUIActions from 'redux/querybookUI/action';
import { Dispatch } from 'redux/store/types';

import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';
import { Markdown } from 'ui/Markdown/Markdown';

import './Announcements.scss';

import { useInterval } from 'hooks/useInterval';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';

export const Announcements: React.FunctionComponent = () => {
    const announcements = useAnnouncements();
    const dispatch: Dispatch = useDispatch();
    const loadAnnouncements = () =>
        dispatch(querybookUIActions.loadAnnouncements());
    const dismissAnnouncement = (id: number) =>
        dispatch(querybookUIActions.dismissAnnouncement(id));

    React.useEffect(() => {
        loadAnnouncements();
        dispatch(querybookUIActions.loadDismissedAnnouncements());
    }, []);

    useInterval(loadAnnouncements, 300000);

    if (announcements.length === 0) {
        return null;
    } else {
        const announcementColors = ['true', 'false'];
        const announcementsDOM = announcements.map((item, index) => {
            const deleteButton = item.can_dismiss ? (
                <IconButton
                    onClick={() => dismissAnnouncement(item.id)}
                    icon="X"
                    noPadding
                />
            ) : null;

            return (
                <Level
                    className={`Announcement ${
                        announcementColors[index % announcementColors.length]
                    }`}
                    key={item.id}
                >
                    <Markdown>{item.message}</Markdown>
                    {deleteButton}
                </Level>
            );
        });
        return <>{announcementsDOM}</>;
    }
};

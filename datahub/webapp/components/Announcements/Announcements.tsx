import React from 'react';
import { useDispatch } from 'react-redux';
import * as datahubUIActions from 'redux/dataHubUI/action';
import { Dispatch } from 'redux/store/types';

import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';

import './Announcements.scss';

import { useInterval } from 'hooks/useInterval';
import { useAnnouncements } from 'hooks/redux/useAnnouncements';

export const Announcements: React.FunctionComponent = () => {
    const announcements = useAnnouncements();
    const dispatch: Dispatch = useDispatch();
    const loadAnnouncements = () =>
        dispatch(datahubUIActions.loadAnnouncements());
    const dismissAnnouncement = (id: number) =>
        dispatch(datahubUIActions.dismissAnnouncement(id));

    React.useEffect(() => {
        loadAnnouncements();
        dispatch(datahubUIActions.loadDismissedAnnouncements());
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
                    icon="x"
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
                    <p dangerouslySetInnerHTML={{ __html: item.message }} />
                    {deleteButton}
                </Level>
            );
        });
        return <>{announcementsDOM}</>;
    }
};

import React, { useEffect, useState, useCallback } from 'react';
import moment from 'moment';

import { CHANGE_LOG_KEY, ChangeLogValue } from 'lib/local-store/const';
import ds from 'lib/datasource';
import localStore from 'lib/local-store';

import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

import './ChangeLogButton.scss';

export const ChangeLogButton: React.FC = () => {
    const [showChangeLogModal, setShowChangeLogModal] = useState(false);
    const [contentLogContent, setContentLogContent] = useState<string>(null);

    const onDismissChangeLog = useCallback(() => {
        // turning it off doesn't really matter
        setShowChangeLogModal(false);
        setContentLogContent(null);
        localStore.set<ChangeLogValue>(
            CHANGE_LOG_KEY,
            moment().format('YYYY-MM-DD')
        );
    }, []);
    useEffect(() => {
        localStore
            .get<ChangeLogValue>(CHANGE_LOG_KEY)
            .then((lastViewedDate) => {
                ds.fetch(`/utils/change_log/`, {
                    last_viewed_date: lastViewedDate,
                }).then(({ data: changeLogContent }) => {
                    setContentLogContent(changeLogContent);
                });
            });
    }, []);

    if (!contentLogContent) {
        return null;
    }

    const modal = showChangeLogModal && (
        <Modal
            onHide={onDismissChangeLog}
            title="Change Logs"
            className="message-size"
        >
            <div className="ChangeLog">
                <div
                    className="content ChangeLog-content"
                    dangerouslySetInnerHTML={{ __html: contentLogContent }}
                />
                <div className="ChangeLog-control">
                    <Button onClick={onDismissChangeLog}>Dismiss</Button>
                </div>
            </div>
        </Modal>
    );

    return (
        <>
            {modal}
            <IconButton
                icon="gift"
                className="ChangeLogButton"
                onClick={() => setShowChangeLogModal(true)}
            />
        </>
    );
};

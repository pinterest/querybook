import * as React from 'react';
import { useParams } from 'react-router-dom';

import ds from 'lib/datasource';
import localStore from 'lib/local-store';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';

import { Content } from 'ui/Content/Content';
import { Icon } from 'ui/Icon/Icon';

import './ChangeLog.scss';

interface IChangeLogItem {
    content: string;
    date: string;
}

export const ChangeLog: React.FunctionComponent = () => {
    const { date: changeLogDate } = useParams();
    const [changeLogContent, setChangeLogContent] = React.useState<string[]>(
        []
    );
    const [changeLogList, setChangeLogList] = React.useState<IChangeLogItem[]>(
        []
    );

    React.useEffect(() => {
        if (changeLogDate) {
            ds.fetch('/utils/change_log/date/', {
                date: changeLogDate,
            }).then(({ data }) => setChangeLogContent([data]));
        } else {
            localStore
                .get<ChangeLogValue>(CHANGE_LOG_KEY)
                .then((localStorageDate) => {
                    ds.fetch(`/utils/change_logs/`).then(
                        ({ data }: { data: IChangeLogItem[] }) => {
                            const lastViewedDate =
                                localStorageDate ?? '2000-01-01';
                            const content = [];

                            for (const log of data) {
                                const isNew =
                                    Date.parse(log.date) >
                                    Date.parse(lastViewedDate);
                                if (isNew) {
                                    content.push(log.content);
                                }
                            }

                            setChangeLogContent(content);
                            setChangeLogList(data);
                        }
                    );
                });
        }
    }, [changeLogDate]);

    const changeLogDOM = changeLogContent.map((text, idx) => (
        <Content
            className="ChangeLog-content mt12 mh12 mb24"
            dangerouslySetInnerHTML={{ __html: text }}
            key={idx}
        />
    ));
    const changeLogListDOM = changeLogDate ? null : (
        <div className="ChangeLog-list">
            <div className="ChangeLog-list-title mt12">Change Logs</div>
            {changeLogList.map((log) => {
                return (
                    <div
                        className="ChangeLog-log-item horizontal-space-between"
                        key={log.date}
                        onClick={() =>
                            navigateWithinEnv(`/changelog/${log.date}/`)
                        }
                    >
                        <div>{log.date}</div>
                        <div className="ChangeLog-arrow">
                            <Icon name="arrow-right" />
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="ChangeLog">
            {changeLogDOM}
            {changeLogListDOM}
        </div>
    );
};

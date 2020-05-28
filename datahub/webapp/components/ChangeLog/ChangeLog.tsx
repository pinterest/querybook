import * as React from 'react';
import { useParams } from 'react-router-dom';

import { navigateWithinEnv } from 'lib/utils/query-string';
import ds from 'lib/datasource';

import { Content } from 'ui/Content/Content';
import { Icon } from 'ui/Icon/Icon';

import './ChangeLog.scss';

interface IChangeLogItem {
    content: string;
    date: string;
}

export const ChangeLog: React.FunctionComponent = () => {
    const { date: changeLogDate } = useParams();
    const [changeLogContent, setChangeLogContent] = React.useState<string>(
        null
    );
    const [changeLogList, setChangeLogList] = React.useState<IChangeLogItem[]>(
        []
    );

    React.useEffect(() => {
        if (changeLogDate) {
            ds.fetch('/utils/change_log/date/', {
                date: changeLogDate,
            }).then(({ data }) => setChangeLogContent(data));
        } else {
            ds.fetch(`/utils/change_logs/`).then(({ data }) => {
                setChangeLogContent(data[0].content);
                setChangeLogList(data);
            });
        }
    }, []);

    const changeLogDOM = (
        <Content
            className="ChangeLog-content m12"
            dangerouslySetInnerHTML={{ __html: changeLogContent }}
        />
    );
    const changeLogListDOM = changeLogDate ? null : (
        <div className="ChangeLog-list">
            <div className="ChangeLog-list-title">Previous Logs</div>
            {changeLogList.map((log, idx) => {
                if (idx === 0) {
                    return null;
                }
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

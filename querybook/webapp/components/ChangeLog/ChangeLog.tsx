import * as React from 'react';
import { useParams } from 'react-router-dom';

import { IChangeLogItem } from 'const/changeLog';
import localStore from 'lib/local-store';
import { sanitizeAndExtraMarkdown } from 'lib/markdown';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { ChangeLogValue, CHANGE_LOG_KEY } from 'lib/local-store/const';
import { ChangeLogResource } from 'resource/utils/changelog';

import { Markdown } from 'ui/Markdown/Markdown';
import { Content } from 'ui/Content/Content';
import { Icon } from 'ui/Icon/Icon';

import './ChangeLog.scss';
import { AccentText } from 'ui/StyledText/StyledText';

const ChangeLogMarkdown: React.FC<{ markdown: string }> = ({ markdown }) => {
    const processedMarkdown = React.useMemo(() => {
        const [text, properties] = sanitizeAndExtraMarkdown(markdown);
        return 'title' in properties
            ? `# ${properties['title']}\n` + text
            : text;
    }, [markdown]);
    return (
        <Content className="ChangeLog-content mt12 mh12 mb24">
            <Markdown>{processedMarkdown}</Markdown>
        </Content>
    );
};

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
            const currentLog = changeLogList.find(
                (log) => log.date === changeLogDate
            );
            if (currentLog) {
                setChangeLogContent([currentLog.content]);
            } else {
                ChangeLogResource.getByDate(changeLogDate).then(({ data }) =>
                    setChangeLogContent([data])
                );
            }
        } else {
            Promise.all([
                localStore.get<ChangeLogValue>(CHANGE_LOG_KEY),
                ChangeLogResource.getAll(),
            ]).then(([localStorageDate, { data }]) => {
                setChangeLogList(data);

                const lastViewedDate = localStorageDate ?? '2000-01-01';
                const content = data
                    .filter((log) => log.date > lastViewedDate)
                    .map((log) => log.content);
                setChangeLogContent(content);
            });
        }
    }, [changeLogDate]);

    const changeLogDOM = changeLogContent.map((text, idx) => (
        <ChangeLogMarkdown markdown={text} key={idx} />
    ));
    const changeLogListDOM = changeLogDate ? null : (
        <div className="ChangeLog-list">
            <AccentText
                className="mt12"
                weight="bold"
                size="large"
                color="dark"
            >
                Change Logs
            </AccentText>
            {changeLogList.map((log) => (
                <div
                    className="ChangeLog-log-item horizontal-space-between mt16 ml16"
                    key={log.date}
                    onClick={() => navigateWithinEnv(`/changelog/${log.date}/`)}
                >
                    <AccentText size="med">{log.date}</AccentText>
                    <div className="ChangeLog-arrow">
                        <Icon name="ArrowRight" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="ChangeLog">
            {changeLogDOM}
            {changeLogListDOM}
        </div>
    );
};

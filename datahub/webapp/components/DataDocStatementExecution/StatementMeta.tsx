import React from 'react';
import Markdown from 'markdown-to-jsx';
import { Message } from 'ui/Message/Message';
import { linkifyLog } from 'lib/utils';

export const StatementMeta: React.FunctionComponent<{ metaInfo?: string }> = ({
    metaInfo,
}) => {
    const linkifiedMetaInfo = React.useMemo(() => linkifyLog(metaInfo ?? ''), [
        metaInfo,
    ]);

    return (
        metaInfo && (
            <div className="StatementMeta">
                <Message className="StatementMeta-Message" size="small">
                    <Markdown>{linkifiedMetaInfo}</Markdown>
                </Message>
            </div>
        )
    );
};

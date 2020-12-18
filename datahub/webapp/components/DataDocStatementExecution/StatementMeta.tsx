import React from 'react';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message } from 'ui/Message/Message';

export const StatementMeta: React.FunctionComponent<{ metaInfo?: string }> = ({
    metaInfo,
}) =>
    metaInfo && (
        <div className="StatementMeta">
            <Message className="StatementMeta-Message" size="small">
                <Markdown>{metaInfo}</Markdown>
            </Message>
        </div>
    );

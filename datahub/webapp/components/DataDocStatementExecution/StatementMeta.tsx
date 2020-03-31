import React from 'react';
import { Message } from 'ui/Message/Message';
import { linkifyLog } from 'lib/utils';

export const StatementMeta: React.FunctionComponent<{ metaInfo?: string }> = ({
    metaInfo,
}) => {
    metaInfo = metaInfo || '';
    const linkifiedMetaInfo = React.useMemo(() => linkifyLog(metaInfo), [
        metaInfo,
    ]);

    return (
        metaInfo && (
            <div className="StatementMeta">
                <Message className="StatementMeta-Message" size="small">
                    <span
                        dangerouslySetInnerHTML={{ __html: linkifiedMetaInfo }}
                    />
                </Message>
            </div>
        )
    );
};

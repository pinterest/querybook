import React from 'react';

import { Message } from 'ui/Message/Message';

interface IErrorQueryCellProps {
    errorMessage?: string;
    collapsed?: boolean;
}
export const ErrorQueryCell: React.FC<IErrorQueryCellProps> = ({
    errorMessage,
    collapsed,
    children,
}) => (
    <div className={'DataDocQueryCell'}>
        <div className="data-doc-query-cell-inner">
            <Message
                title={'Invalid Query Cell'}
                message={errorMessage}
                type="error"
            />
            {collapsed ? null : children}
        </div>
    </div>
);

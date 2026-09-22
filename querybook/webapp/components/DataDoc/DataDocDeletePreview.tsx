import React, { useEffect, useState } from 'react';

import { IDataCell } from 'const/datadoc';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';

interface IProps {
    cell: IDataCell;
}

export const DataDocDeletePreview: React.FunctionComponent<IProps> = ({
    cell,
}) => {
    const [query, setQuery] = useState<string>();

    useEffect(() => {
        setQuery(cell.context as string);
    }, [cell.context]);

    return (
        <div>
            <span>Deleted cells cannot be recovered</span>
            {cell.cell_type === 'query' && query !== '' && (
                <ThemedCodeHighlightWithMark
                    query={query}
                    maxEditorHeight="20vh"
                    autoHeight={false}
                />
            )}
        </div>
    );
};

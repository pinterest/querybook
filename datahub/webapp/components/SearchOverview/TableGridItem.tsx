import React from 'react';

import { GenericGridItem } from 'components/GenericGridItem/GenericGridItem';
import { ITablePreview } from 'redux/search/types';

interface IProps {
    data: ITablePreview;
    onClick: (data: ITablePreview) => any;
}

export const TableGridItem: React.FunctionComponent<IProps> = ({
    data: table,
    onClick,
}) => {
    return (
        <div className="TableGridItem">
            <GenericGridItem
                title={`${table.schema}.${table.name}`}
                date={table.created_at}
                onClick={() => onClick(table)}
            />
        </div>
    );
};

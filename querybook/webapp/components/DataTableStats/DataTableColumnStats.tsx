import * as React from 'react';

import { ITableColumnStats } from 'const/metastore';

import { Tag, TagGroup } from 'ui/Tag/Tag';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

interface IProps {
    stats: ITableColumnStats[];
}

export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    stats,
}) => {
    const statsDOM = (stats || []).map((stat, i) => {
        const formattedValue = Array.isArray(stat.value)
            ? stat.value.join(', ')
            : stat.value;
        return (
            <TagGroup key={stat.key}>
                <Tag>{stat.key}</Tag>
                <Tag highlighted>{formattedValue}</Tag>
            </TagGroup>
        );
    });

    return (
        <div className="DataTableColumnStats">
            <KeyContentDisplay keyString="Stats">{statsDOM}</KeyContentDisplay>
        </div>
    );
};

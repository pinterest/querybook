import { ContentState } from 'draft-js';
import React from 'react';

import { TableTag } from 'components/DataTableTags/DataTableTags';
import { IDataColumn } from 'const/metastore';
import { useResource } from 'hooks/useResource';
import { TableColumnResource } from 'resource/table';
import { Tag, TagGroup } from 'ui/Tag/Tag';

interface IProps {
    column: IDataColumn;
}

export const TableColumnTooltip: React.FunctionComponent<IProps> = ({
    column,
}) => {
    const { data: tags } = useResource(
        React.useCallback(
            () => TableColumnResource.getTags(column.id),
            [column.id]
        )
    );

    const tagsDOM = (tags || []).map((tag) => (
        <TableTag tag={tag} readonly={true} key={tag.id} mini={true} />
    ));

    const description =
        typeof column.description === 'string'
            ? column.description
            : (column.description as ContentState).getPlainText();

    const statsDOM = (column.stats || []).map((stat, i) => {
        const formattedValue = Array.isArray(stat.value)
            ? stat.value.join(', ')
            : stat.value;
        return (
            <TagGroup key={stat.key}>
                <Tag mini>{stat.key}</Tag>
                <Tag highlighted mini>
                    {formattedValue}
                </Tag>
            </TagGroup>
        );
    });

    const contentDOM = (
        <>
            <div className="tooltip-header flex-row">
                <div>{column.name}</div>
            </div>
            {column.type && (
                <div className="mt4 flex-row">
                    <div className="tooltip-title">Type:</div>
                    <div className="tooltip-content">{column.type}</div>
                </div>
            )}
            {tagsDOM.length > 0 && (
                <div className="DataTableTags flex-row">{tagsDOM}</div>
            )}
            {column.comment && (
                <div className="mt4">
                    <div className="tooltip-title">Definition</div>
                    <div className="tooltip-content">{column.comment}</div>
                </div>
            )}
            {description && (
                <div className="mt4">
                    <div className="tooltip-title">Description</div>
                    <div className="tooltip-content">{description}</div>
                </div>
            )}
            {statsDOM.length && (
                <div className="mt4">
                    <div className="tooltip-title">Stats</div>
                    <div className="tooltip-content">{statsDOM}</div>
                </div>
            )}
        </>
    );

    return <div className="rich-text-content">{contentDOM}</div>;
};

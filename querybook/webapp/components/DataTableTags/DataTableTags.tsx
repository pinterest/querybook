import * as React from 'react';
import { ITag } from 'const/tag';
import { GenericTag, GenericTags } from '../GenericTags/Tags';

import './DataTableTags.scss';

interface IProps {
    tableId: number;
    readonly?: boolean;
    mini?: boolean;
    showType?: boolean;
}

export const DataTableTags: React.FunctionComponent<IProps> = ({
    tableId,
    readonly = false,
    mini = false,
    showType = true,
}) => (
    <GenericTags
        id={tableId}
        readonly={readonly}
        mini={mini}
        showType={showType}
        tagType={'Table'}
    />
);

export const TableTag: React.FC<{
    tag: ITag;

    isUserAdmin?: boolean;
    readonly?: boolean;
    deleteTag?: (tagName: string) => void;
    mini?: boolean;
    showType?: boolean;
}> = ({ tag, readonly, deleteTag, isUserAdmin, mini, showType = true }) => (
    <GenericTag
        tag={tag}
        isUserAdmin={isUserAdmin}
        readonly={readonly}
        deleteTag={deleteTag}
        mini={mini}
        showType={showType}
        tagType={'Table'}
    />
);

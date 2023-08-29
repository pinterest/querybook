import * as React from 'react';
import { ITag } from 'const/tag';
import { GenericTag, GenericTags } from '../GenericTags/Tags';

import './DataDocTags.scss';

interface IProps {
    datadocId: number;
    readonly?: boolean;
    mini?: boolean;
    showType?: boolean;
}

export const DataDocTags: React.FunctionComponent<IProps> = ({
    datadocId,
    readonly = false,
    mini = false,
    showType = true,
}) => (
    <GenericTags
        id={datadocId}
        readonly={readonly}
        mini={mini}
        showType={showType}
        tagType={'DataDoc'}
    />
);

export const DataDocTag: React.FC<{
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

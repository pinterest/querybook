import qs from 'qs';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ITag } from 'const/tag';
import { Dispatch, IStoreState } from 'redux/store/types';
import {
    fetchTableTagsFromTableIfNeeded,
    deleteTableTag,
} from 'redux/tag/action';
import { navigateWithinEnv } from 'lib/utils/query-string';

import { HoverIconTag } from 'ui/Tag/HoverIconTag';
import { Icon } from 'ui/Icon/Icon';

import { CreateDataTableTag } from './CreateDataTableTag';
import { useRankedTags } from './utils';
import './DataTableTags.scss';

interface IProps {
    tableId: number;
    readonly?: boolean;
}

export const DataTableTags: React.FunctionComponent<IProps> = ({
    tableId,
    readonly = false,
}) => {
    const isUserAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );
    const dispatch: Dispatch = useDispatch();
    const loadTags = React.useCallback(
        () => dispatch(fetchTableTagsFromTableIfNeeded(tableId)),
        [tableId]
    );
    const deleteTag = React.useCallback(
        (tagName: string) => dispatch(deleteTableTag(tableId, tagName)),
        [tableId]
    );

    const tags = useRankedTags(
        useSelector((state: IStoreState) => state.tag.tagByTableId[tableId])
    );

    React.useEffect(() => {
        loadTags();
    }, []);

    const listDOM = (tags || []).map((tag) => (
        <TableTag
            tag={tag}
            readonly={readonly}
            deleteTag={deleteTag}
            key={tag.id}
            isUserAdmin={isUserAdmin}
        />
    ));

    return (
        <div className="DataTableTags flex-row">
            {listDOM}
            {readonly ? null : (
                <CreateDataTableTag tableId={tableId} tags={tags} />
            )}
        </div>
    );
};

export const TableTag: React.FC<{
    tag: ITag;

    isUserAdmin?: boolean;
    readonly?: boolean;
    navigateOnClick?: boolean;
    deleteTag?: (tagName: string) => void;
}> = ({ tag, readonly, deleteTag, navigateOnClick, isUserAdmin }) => {
    const tagMeta = tag.meta ?? {};
    const handleTagClick = React.useCallback(() => {
        navigateWithinEnv(
            `/search/?${qs.stringify({
                searchType: 'Table',
                'searchFilters[tags][0]': tag.name,
            })}`,
            {
                isModal: true,
            }
        );
    }, [tag.name]);

    const canUserDelete = !readonly && !(tagMeta.admin && !isUserAdmin);

    return (
        <HoverIconTag
            key={tag.id}
            iconOnHover={canUserDelete ? 'X' : null}
            onIconHoverClick={canUserDelete ? () => deleteTag(tag.name) : null}
            tooltip={tagMeta.tooltip}
            tooltipPos={'up'}
            color={tagMeta.color}
        >
            {tagMeta.icon && (
                <Icon name={tagMeta.icon as any} size={16} className="mr4" />
            )}
            <span onClick={navigateOnClick ? handleTagClick : null}>
                {tag.name}
            </span>
        </HoverIconTag>
    );
};

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

import { MenuItem, Menu } from 'ui/Menu/Menu';
import { ContextMenu } from 'ui/ContextMenu/ContextMenu';

import { CreateDataTableTag } from './CreateDataTableTag';
import { useRankedTags } from './utils';
import './DataTableTags.scss';
import { TableTagConfigModal } from './TableTagConfigModal';
import { tagsInTableSelector } from 'redux/tag/selector';

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
        useSelector((state: IStoreState) => tagsInTableSelector(state, tableId))
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
    deleteTag?: (tagName: string) => void;
}> = ({ tag, readonly, deleteTag, isUserAdmin }) => {
    const tagMeta = tag.meta ?? {};
    const tagRef = React.useRef<HTMLSpanElement>();
    const [showConfigModal, setShowConfigModal] = React.useState(false);

    const handleDeleteTag = React.useCallback(() => deleteTag(tag.name), [
        deleteTag,
        tag.name,
    ]);
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

    const canUserUpdate = !(tagMeta.admin && !isUserAdmin);
    const canUserDelete = !readonly && canUserUpdate;

    const renderContextMenu = () => (
        <Menu>
            <MenuItem onClick={() => setShowConfigModal(true)}>
                <Icon name="Settings" className="mr8" size={20} />
                Configure Tag
            </MenuItem>
            <MenuItem onClick={handleDeleteTag}>
                <Icon name="Trash2" className="mr8" size={20} />
                Remove Tag
            </MenuItem>
        </Menu>
    );

    return (
        <>
            {canUserUpdate && (
                <ContextMenu
                    anchorRef={tagRef}
                    renderContextMenu={renderContextMenu}
                />
            )}

            {showConfigModal && (
                <TableTagConfigModal
                    tag={tag}
                    onHide={() => setShowConfigModal(false)}
                />
            )}

            <HoverIconTag
                key={tag.id}
                iconOnHover={canUserDelete ? 'X' : null}
                onIconHoverClick={canUserDelete ? handleDeleteTag : null}
                tooltip={tagMeta.tooltip}
                tooltipPos={'up'}
                color={tagMeta.color}
                onClick={handleTagClick}
                ref={tagRef}
                withBorder={tagMeta.admin}
            >
                {tagMeta.icon && (
                    <Icon
                        name={tagMeta.icon as any}
                        size={16}
                        className="mr4"
                    />
                )}
                <span>{tag.name}</span>
            </HoverIconTag>
        </>
    );
};

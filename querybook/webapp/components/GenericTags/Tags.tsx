import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import {
    deleteDataDocTag,
    deleteTableTag,
    fetchDataDocTagsFromTableIfNeeded,
    fetchTableTagsFromTableIfNeeded,
} from 'redux/tag/action';
import { useRankedTags } from '../../lib/utils/tag';
import { tagsInDataDocSelector, tagsInTableSelector } from 'redux/tag/selector';
import { CreateDataDocTag } from '../DataDocTags/CreateDataDocTag';
import { DataDocTag } from '../DataDocTags/DataDocTags';
import { CreateDataTableTag } from '../DataTableTags/CreateDataTableTag';
import { ITag } from 'const/tag';
import { stopPropagationAndDefault } from 'lib/utils/noop';
import { navigateWithinEnv } from 'lib/utils/query-string';
import qs from 'qs';
import { Menu, MenuItem } from 'ui/Menu/Menu';
import { Icon } from 'ui/Icon/Icon';
import { ContextMenu } from 'ui/ContextMenu/ContextMenu';
import { DataDocTagConfigModal } from '../DataDocTags/DataDocTagConfigModal';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';
import { TableTagConfigModal } from '../DataTableTags/TableTagConfigModal';

interface IProps {
    id: number;
    readonly?: boolean;
    mini?: boolean;
    showType?: boolean;
    tagType: string;
}

export const GenericTags: React.FunctionComponent<IProps> = ({
    id,
    readonly = false,
    mini = false,
    showType = true,
    tagType,
}) => {
    const isUserAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );
    const dispatch: Dispatch = useDispatch();

    let fetchFunc;
    let deleteFunc;
    let selector;
    if (tagType === 'DataDoc') {
        fetchFunc = fetchDataDocTagsFromTableIfNeeded;
        deleteFunc = deleteDataDocTag;
        selector = tagsInDataDocSelector;
    } else if (tagType === 'Table') {
        fetchFunc = fetchTableTagsFromTableIfNeeded;
        deleteFunc = deleteTableTag;
        selector = tagsInTableSelector;
    }

    const loadTags = React.useCallback(() => dispatch(fetchFunc(id)), [id]);
    const deleteTag = React.useCallback(
        (tagName: string) => dispatch(deleteFunc(id, tagName)),
        [id]
    );

    const tags = useRankedTags(
        useSelector((state: IStoreState) => selector(state, id))
    );

    React.useEffect(() => {
        loadTags();
    }, []);

    const listDOM = (tags || []).map((tag) => (
        <DataDocTag
            tag={tag}
            readonly={readonly}
            deleteTag={deleteTag}
            key={tag.id}
            isUserAdmin={isUserAdmin}
            mini={mini}
            showType={showType}
        />
    ));

    if (tagType === 'DataDoc') {
        return (
            <div className="DataDocTags flex-row">
                {listDOM}
                {readonly ? null : (
                    <CreateDataDocTag datadocId={id} tags={tags} />
                )}
            </div>
        );
    } else if (tagType === 'Table') {
        return (
            <div className="DataTableTags flex-row">
                {listDOM}
                {readonly ? null : (
                    <CreateDataTableTag tableId={id} tags={tags} />
                )}
            </div>
        );
    }
};

export const GenericTag: React.FC<{
    tag: ITag;

    isUserAdmin?: boolean;
    readonly?: boolean;
    deleteTag?: (tagName: string) => void;
    mini?: boolean;
    showType?: boolean;
    tagType: string;
}> = ({
    tag,
    readonly,
    deleteTag,
    isUserAdmin,
    mini,
    showType = true,
    tagType,
}) => {
    const tagMeta = tag.meta ?? {};
    const tagRef = React.useRef<HTMLSpanElement>();
    const [showConfigModal, setShowConfigModal] = React.useState(false);

    const handleDeleteTag = React.useCallback(
        (e: React.MouseEvent<HTMLSpanElement>) => {
            stopPropagationAndDefault(e);
            deleteTag(tag.name);
        },
        [deleteTag, tag.name]
    );
    const handleTagClick = React.useCallback(() => {
        navigateWithinEnv(
            `/search/?${qs.stringify({
                searchType: tagType,
                'searchFilters[tags][0]': tag.name,
            })}`,
            {
                isModal: true,
            }
        );
    }, [tag.name]);

    // user can update if it is not readonly and passes the admin check
    const canUserUpdate = !(readonly || (tagMeta.admin && !isUserAdmin));
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

    let configModal;
    let className;
    if (tagType === 'DataDoc') {
        className = 'DataDocTag';
        configModal = (
            <DataDocTagConfigModal
                tag={tag}
                onHide={() => setShowConfigModal(false)}
            />
        );
    } else if (tagType === 'Table') {
        className = 'TableTag';
        configModal = (
            <TableTagConfigModal
                tag={tag}
                onHide={() => setShowConfigModal(false)}
            />
        );
    }

    return (
        <div className={className}>
            {canUserUpdate && (
                <ContextMenu
                    anchorRef={tagRef}
                    renderContextMenu={renderContextMenu}
                />
            )}

            {showConfigModal && configModal}
            <HoverIconTag
                key={tag.id}
                name={tag.name}
                type={tagMeta.type}
                icon={tagMeta.icon}
                iconOnHover={canUserDelete ? 'X' : null}
                onIconHoverClick={canUserDelete ? handleDeleteTag : null}
                tooltip={tagMeta.tooltip}
                tooltipPos={'up'}
                color={tagMeta.color}
                onClick={handleTagClick}
                ref={tagRef}
                mini={mini}
                showType={showType}
            />
        </div>
    );
};

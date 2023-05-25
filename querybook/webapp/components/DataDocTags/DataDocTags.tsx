import qs from 'qs';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ITag } from 'const/tag';
import { stopPropagationAndDefault } from 'lib/utils/noop';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useRankedTags } from 'lib/utils/tag';
import { Dispatch, IStoreState } from 'redux/store/types';
import {
    deleteDataDocTag,
    fetchDataDocTagsFromTableIfNeeded,
} from 'redux/tag/action';
import { tagsInDataDocSelector } from 'redux/tag/selector';
import { ContextMenu } from 'ui/ContextMenu/ContextMenu';
import { Icon } from 'ui/Icon/Icon';
import { Menu, MenuItem } from 'ui/Menu/Menu';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import { CreateDataDocTag } from './CreateDataDocTag';
import { DataDocTagConfigModal } from './DataDocTagConfigModal';

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
}) => {
    const isUserAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );
    const dispatch: Dispatch = useDispatch();
    const loadTags = React.useCallback(
        () => dispatch(fetchDataDocTagsFromTableIfNeeded(datadocId)),
        [datadocId]
    );
    const deleteTag = React.useCallback(
        (tagName: string) => dispatch(deleteDataDocTag(datadocId, tagName)),
        [datadocId]
    );

    const tags = useRankedTags(
        useSelector((state: IStoreState) => tagsInDataDocSelector(state, datadocId))
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

    return (
        <div className="DataDocTags flex-row">
            {listDOM}
            {readonly ? null : (
                <CreateDataDocTag datadocId={datadocId} tags={tags} />
            )}
        </div>
    );
};

export const DataDocTag: React.FC<{
    tag: ITag;

    isUserAdmin?: boolean;
    readonly?: boolean;
    deleteTag?: (tagName: string) => void;
    mini?: boolean;
    showType?: boolean;
}> = ({ tag, readonly, deleteTag, isUserAdmin, mini, showType = true }) => {
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
                searchType: 'DataDoc',
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

    return (
        <div className="DataDocTag">
            {canUserUpdate && (
                <ContextMenu
                    anchorRef={tagRef}
                    renderContextMenu={renderContextMenu}
                />
            )}

            {showConfigModal && (
                <DataDocTagConfigModal
                    tag={tag}
                    onHide={() => setShowConfigModal(false)}
                />
            )}
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

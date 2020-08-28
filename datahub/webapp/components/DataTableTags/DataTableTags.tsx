import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, IStoreState } from 'redux/store/types';
import {
    fetchTagItemsIfNeeded,
    createTagItem,
    deleteTagItem,
} from 'redux/tag/action';

import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { IconButton } from 'ui/Button/IconButton';
import { Tag } from 'ui/Tag/Tag';

import './DataTableTags.scss';

interface IProps {
    tableId: number;
    uid?: number;
    readonly?: boolean;
}

export const DataTableTags: React.FunctionComponent<IProps> = ({
    tableId,
    uid,
    readonly,
}) => {
    const dispatch: Dispatch = useDispatch();
    const loadTags = React.useCallback(
        () => dispatch(fetchTagItemsIfNeeded(tableId)),
        [tableId]
    );
    const createTag = React.useCallback(
        (tag) => dispatch(createTagItem(tableId, tag)),
        [tableId]
    );
    const deleteTag = React.useCallback(
        (tagId) => dispatch(deleteTagItem(tableId, tagId)),
        [tableId]
    );

    const { tags } = useSelector((state: IStoreState) => ({
        tags: state.tag.tagItemByTableId[tableId],
    }));

    const [tagString, setTagString] = React.useState('');
    const [isAdding, setIsAdding] = React.useState(false);

    React.useEffect(() => {
        loadTags();
    }, []);

    // change isAdding on esc and add on enter
    const addDOM = isAdding ? (
        <div className="DataTableTags-input flex-row">
            <DebouncedInput
                value={tagString}
                onChange={(str) => setTagString(str)}
            />
            {tagString.length ? (
                <IconButton
                    icon="plus"
                    onClick={() => {
                        createTag(tagString);
                        setTagString('');
                    }}
                />
            ) : (
                <IconButton icon="x" onClick={() => setIsAdding(false)} />
            )}
        </div>
    ) : (
        <IconButton
            icon="plus"
            onClick={() => setIsAdding(true)}
            tooltip="Add tag"
            tooltipPos="right"
        />
    );

    const listDOM = (tags || [])
        .sort((t1, t2) => t1.count - t2.count)
        .map((tag) => {
            if (tag.uid === uid) {
                return (
                    <Tag
                        key={tag.id}
                        iconOnHover="x"
                        onHoverClick={() => deleteTag(tag.id)}
                        tooltip="click to search by tag"
                        tooltipPos="right"
                    >
                        {tag.tag}
                    </Tag>
                );
            } else {
                return (
                    <Tag
                        key={tag.id}
                        tooltip="click to search by tag"
                        tooltipPos="right"
                    >
                        {tag.tag}
                    </Tag>
                );
            }
        });

    return (
        <div className="DataTableTags flex-row">
            {listDOM}
            {readonly ? null : (
                <div className="DataTableTags-add flex-row">{addDOM}</div>
            )}
        </div>
    );
};

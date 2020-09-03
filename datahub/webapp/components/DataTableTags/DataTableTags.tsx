import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, IStoreState } from 'redux/store/types';
import {
    fetchTagItemsIfNeeded,
    createTagItem,
    deleteTagItem,
} from 'redux/tag/action';
import { matchKeyPress } from 'lib/utils/keyboard';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useDataFetch } from 'hooks/useDataFetch';
import { useEvent } from 'hooks/useEvent';

import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { IconButton } from 'ui/Button/IconButton';
import { Tag } from 'ui/Tag/Tag';

import './DataTableTags.scss';
import { string } from 'yup';

interface IProps {
    tableId: number;
    readonly?: boolean;
}

export const DataTableTags: React.FunctionComponent<IProps> = ({
    tableId,
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

    const tags = useSelector(
        (state: IStoreState) => state.tag.tagItemByTableId[tableId]
    );
    const existingTags = React.useMemo(
        () => (tags || []).map((tag) => tag.tag_name),
        [tags]
    );

    const [tagString, setTagString] = React.useState('');
    const [isAdding, setIsAdding] = React.useState(false);
    const isValid = React.useMemo(() => {
        const regex = /^[a-z0-9]+$/i;
        const match = tagString.match(regex);
        return Boolean(match && !existingTags.includes(tagString));
    }, [tagString]);

    const {
        data: rawTagSuggestions,
        forceFetch: loadTagSuggestions,
    }: { data: string[]; forceFetch } = useDataFetch({
        url: '/tag/prefix/',
        params: {
            prefix: tagString,
        },
        fetchOnMount: false,
    });

    const tagSuggestions = React.useMemo(() => {
        return (rawTagSuggestions || []).filter(
            (str) => !existingTags.includes(str)
        );
    }, [tagString, rawTagSuggestions, tags]);

    React.useEffect(() => {
        loadTags();
    }, []);

    React.useEffect(() => {
        if (isAdding) {
            loadTagSuggestions();
        }
    }, [tagString, isAdding]);

    useEvent('keydown', (evt: KeyboardEvent) => {
        if (isAdding) {
            if (matchKeyPress(evt, 'Enter')) {
                onCreateTag();
            } else if (matchKeyPress(evt, 'Esc')) {
                clearCreateState();
            }
        }
    });

    const clearCreateState = React.useCallback(() => {
        setTagString('');
        setIsAdding(false);
    }, []);

    const onCreateTag = React.useCallback(async () => {
        await createTag(tagString);
        clearCreateState();
    }, [tagString]);

    const makeAddDOM = () =>
        isAdding ? (
            <div className="DataTableTags-input flex-row">
                <DebouncedInput
                    value={tagString}
                    onChange={(str) => setTagString(str)}
                    inputProps={{ placeholder: 'alphanumeric only' }}
                    className={isValid ? '' : 'invalid-string'}
                    options={tagSuggestions}
                    optionKey={`data-table-tags-${tableId}`}
                />
                {tagString.length && isValid ? (
                    <IconButton icon="plus" onClick={onCreateTag} size={20} />
                ) : (
                    <IconButton
                        icon="x"
                        onClick={() => setIsAdding(false)}
                        size={20}
                    />
                )}
            </div>
        ) : (
            <IconButton
                icon="plus"
                onClick={() => setIsAdding(true)}
                tooltip="Add tag"
                tooltipPos="right"
                size={20}
            />
        );

    const listDOM = (tags || []).map((tag) => (
        <Tag
            key={tag.id}
            onClick={() =>
                navigateWithinEnv(
                    `/search/?searchType=Table&searchString=${tag.tag_name}`,
                    { isModal: true }
                )
            }
            iconOnHover={readonly ? null : 'x'}
            onHoverClick={readonly ? null : () => deleteTag(tag.id)}
        >
            {tag.tag_name}
        </Tag>
    ));

    return (
        <div className="DataTableTags flex-row">
            {listDOM}
            {readonly ? null : (
                <div className="DataTableTags-add flex-row">{makeAddDOM()}</div>
            )}
        </div>
    );
};

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, IStoreState } from 'redux/store/types';
import {
    fetchTableTagItemsIfNeeded,
    deleteTableTagItem,
} from 'redux/tag/action';
import * as searchActions from 'redux/search/action';
import { navigateWithinEnv } from 'lib/utils/query-string';

import { CreateDataTableTag } from './CreateDataTableTag';

import { Tag } from 'ui/Tag/Tag';

import './DataTableTags.scss';

interface IProps {
    tableId: number;
    readonly?: boolean;
}

export const DataTableTags: React.FunctionComponent<IProps> = ({
    tableId,
    readonly = false,
}) => {
    const dispatch: Dispatch = useDispatch();
    const loadTags = React.useCallback(
        () => dispatch(fetchTableTagItemsIfNeeded(tableId)),
        [tableId]
    );
    const deleteTag = React.useCallback(
        (tagId) => dispatch(deleteTableTagItem(tableId, tagId)),
        [tableId]
    );

    const updateSearchString = React.useCallback(
        (searchStringParam: string) => {
            dispatch(searchActions.updateSearchString(searchStringParam));
        },
        []
    );
    const updateSearchType = React.useCallback((type) => {
        dispatch(searchActions.updateSearchType(type));
    }, []);
    const updateSearchField = React.useCallback((field) => {
        dispatch(searchActions.updateSearchField(field));
    }, []);

    const tags = useSelector(
        (state: IStoreState) => state.tag.tagItemByTableId[tableId]
    );

    const handleClick = React.useCallback((tag_name) => {
        navigateWithinEnv('/search/', { isModal: true });
        updateSearchString(tag_name);
        updateSearchType('Table');
        updateSearchField('tag');
    }, []);

    React.useEffect(() => {
        loadTags();
    }, []);

    const listDOM = (tags || []).map((tag) => (
        <Tag
            key={tag.id}
            iconOnHover={readonly ? null : 'x'}
            onHoverClick={readonly ? null : () => deleteTag(tag.id)}
        >
            <span onClick={() => handleClick(tag.tag_name)}>
                {tag.tag_name}
            </span>
        </Tag>
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

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, IStoreState } from 'redux/store/types';
import {
    fetchTableTagItemsIfNeeded,
    deleteTableTagItem,
} from 'redux/tag/action';
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
    readonly,
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

    const tags = useSelector(
        (state: IStoreState) => state.tag.tagItemByTableId[tableId]
    );

    const existingTags = React.useMemo(
        () => (tags || []).map((tag) => tag.tag_name),
        [tags]
    );

    React.useEffect(() => {
        loadTags();
    }, []);

    const listDOM = (tags || []).map((tag) => (
        <Tag
            key={tag.id}
            iconOnHover={readonly ? null : 'x'}
            onHoverClick={readonly ? null : () => deleteTag(tag.id)}
        >
            <span
                onClick={() =>
                    navigateWithinEnv(
                        `/search/?searchType=Table&searchString=${tag.tag_name}`,
                        { isModal: true }
                    )
                }
            >
                {tag.tag_name}
            </span>
        </Tag>
    ));

    return (
        <div className="DataTableTags flex-row">
            {listDOM}
            {readonly ? null : (
                <CreateDataTableTag
                    tableId={tableId}
                    existingTags={existingTags}
                />
            )}
        </div>
    );
};

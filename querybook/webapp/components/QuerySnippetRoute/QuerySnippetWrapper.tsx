import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { QuerySnippetComposer } from 'components/QuerySnippetComposer/QuerySnippetComposer';
import * as querySnippetsActions from 'redux/querySnippets/action';
import { IStoreState } from 'redux/store/types';
import { Loader } from 'ui/Loader/Loader';

export const QuerySnippetWrapper: React.FunctionComponent<{ id: number }> = ({
    id,
}) => {
    const querySnippetById = useSelector(
        (state: IStoreState) => state.querySnippets.querySnippetById
    );
    const dispatch = useDispatch();
    const fetchQuerySnippetIfNeeded = React.useCallback(
        (snippetId: number) =>
            dispatch(querySnippetsActions.fetchQuerySnippetIfNeeded(snippetId)),
        []
    );
    return (
        <Loader
            item={querySnippetById[id] && querySnippetById[id].context}
            itemKey={id}
            itemLoader={fetchQuerySnippetIfNeeded.bind(null, id)}
        >
            <QuerySnippetComposer querySnippet={querySnippetById[id]} />
        </Loader>
    );
};

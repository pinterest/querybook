import React, { useCallback } from 'react';
import { escapeRegExp } from 'lodash';

import history from 'lib/router-history';
import { generateFormattedDate } from 'lib/utils/datetime';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { IDataDocPreview, IQueryPreview, ITablePreview } from 'const/search';
import { Icon } from 'ui/Icon/Icon';
import { Tag } from 'ui/Tag/Tag';
import { useUser } from 'hooks/redux/useUser';
import { Level } from 'ui/Level/Level';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { useSelector } from 'react-redux';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import './SearchResultItem.scss';

const HighlightTitle: React.FunctionComponent<{
    title: string;
    searchString: string;
}> = ({ title, searchString }) => {
    const highlightReplace = (text: string) => `<mark>${text}</mark>`;
    let highlightedTitle = title;
    if (searchString && searchString.length) {
        const searchStringRegex = new RegExp(escapeRegExp(searchString), 'ig');
        highlightedTitle = title.replace(searchStringRegex, highlightReplace);
    }

    return (
        <div
            className="result-item-title"
            dangerouslySetInnerHTML={{
                __html: highlightedTitle,
            }}
        />
    );
};

function formatHighlightStrings(strArr: string[]) {
    return strArr.join(' ... ').replace(/<\/mark>\s*<mark>/g, ' ');
}

function openClick(
    url: string,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
) {
    // cmd or ctrl or middle button
    if (e.metaKey || e.ctrlKey || e.button === 1) {
        window.open(url);
    } else {
        history.push(url);
    }
}

interface IQueryItemProps {
    preview: IQueryPreview;
    searchString: string;
    environmentName: string;
}

export const QueryItem: React.FunctionComponent<IQueryItemProps> = ({
    preview,
    environmentName,
    searchString,
}) => {
    const {
        author_uid: authorUid,
        created_at: createdAt,
        engine_id: engineId,
        id,
        query_text: queryText,
        title,
    } = preview;
    const { userInfo: authorInfo, loading } = useUser({ uid: authorUid });

    const isQueryCell = preview.query_type === 'query_cell';

    const url = isQueryCell
        ? `/${environmentName}/datadoc/${preview.data_doc_id}/?cellId=${id}`
        : `/${environmentName}/query_execution/${id}/`;
    const handleClick = React.useMemo(() => openClick.bind(null, url), [url]);
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);

    if (loading) {
        return <div className="SearchResultItem QueryItem">Loading...</div>;
    }

    // Query cell title is data cell title
    // Query execution title is "<title> > Execution <id>" for data cell executions
    // or "Adhoc Execution <id>" for adhoc exeuctions
    const resultTitle = isQueryCell
        ? title ?? 'Untitled'
        : `${title != null ? `${title} >` : 'Adhoc'} Execution ${id}`;
    const queryTextHighlightedContent = preview.highlight?.query_text;
    const getQueryTextHighlightedDOM = (queryTextContent: string[]) => (
        <span
            className="result-item-description"
            dangerouslySetInnerHTML={{
                __html: formatHighlightStrings(queryTextContent),
            }}
        />
    );

    const queryEngine = queryEngineById[engineId];

    return (
        <div className="SearchResultItem QueryItem" onClick={handleClick}>
            <div className="result-items">
                <a className="result-items-top horizontal-space-between">
                    <HighlightTitle
                        title={resultTitle}
                        searchString={searchString}
                    />
                    {queryEngine && <Tag>{queryEngine.name}</Tag>}
                </a>
                {queryTextHighlightedContent ? (
                    getQueryTextHighlightedDOM(queryTextHighlightedContent)
                ) : (
                    <ThemedCodeHighlight
                        className="result-item-query"
                        value={queryText}
                        onClick={(event) => event.stopPropagation()}
                    />
                )}
                <Level className="result-items-bottom">
                    <span className="result-item-owner">
                        {authorInfo.username}
                    </span>
                    <span className="result-item-date">
                        {generateFormattedDate(createdAt, 'X')}
                    </span>
                </Level>
            </div>
        </div>
    );
};

interface IDataDocItemProps {
    preview: IDataDocPreview;
    searchString: string;
    url: string;
}

export const DataDocItem: React.FunctionComponent<IDataDocItemProps> = ({
    preview,
    url,
    searchString,
}) => {
    const { owner_uid: ownerUid, created_at: createdAt } = preview;
    const { userInfo: ownerInfo, loading } = useUser({ uid: ownerUid });
    const handleClick = React.useMemo(() => openClick.bind(null, url), [url]);

    if (loading) {
        return <div className="SearchResultItem DataDocItem">Loading...</div>;
    }

    const title = preview.title || 'Untitled Doc';
    const dataDocContent = (preview.highlight || {}).cells;
    const descriptionDOM = dataDocContent && (
        <span
            className="result-item-description"
            dangerouslySetInnerHTML={{
                __html: formatHighlightStrings(dataDocContent),
            }}
        />
    );

    return (
        <div className="SearchResultItem DataDocItem" onMouseDown={handleClick}>
            <div className="result-item-icon">
                <UserAvatar uid={ownerUid} />
            </div>
            <div className="result-items">
                <a className="result-items-top horizontal-space-between">
                    <HighlightTitle title={title} searchString={searchString} />
                </a>
                {descriptionDOM}
                <Level className="result-items-bottom">
                    <span className="result-item-owner">
                        {ownerInfo.username}
                    </span>
                    <span className="result-item-date">
                        {generateFormattedDate(createdAt, 'X')}
                    </span>
                </Level>
            </div>
        </div>
    );
};

interface IDataTableItemProps {
    preview: ITablePreview;
    searchString: string;
    url: string;
}

export const DataTableItem: React.FunctionComponent<IDataTableItemProps> = ({
    preview,
    searchString,
    url,
}) => {
    const {
        golden,
        description,
        created_at: createdAt,
        name,
        schema,
    } = preview;
    const handleClick = useCallback(
        (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
            openClick(url, evt),
        [url]
    );

    const goldenIcon = golden ? (
        <div className="result-item-golden">
            <Icon className="award" name="award" />
        </div>
    ) : null;

    const highlightedDescription = (preview.highlight || {}).description;
    const descriptionDOM = highlightedDescription ? (
        <span
            dangerouslySetInnerHTML={{
                __html: formatHighlightStrings(highlightedDescription),
            }}
        />
    ) : (
        description || 'no description'
    );

    return (
        <div className="SearchResultItem flex-row" onClick={handleClick}>
            <div className="result-items">
                <a className="result-items-top horizontal-space-between">
                    <HighlightTitle
                        title={`${schema}.${name}`}
                        searchString={searchString}
                    />
                    {goldenIcon}
                </a>
                <Level className="result-items-bottom">
                    <span className="result-item-description">
                        {descriptionDOM}
                    </span>
                    <span className="result-item-date">
                        {generateFormattedDate(createdAt, 'X')}
                    </span>
                </Level>
            </div>
        </div>
    );
};

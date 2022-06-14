import React, { useRef, useState } from 'react';
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
import { IconButton } from 'ui/Button/IconButton';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { stopPropagation } from 'lib/utils/noop';
import { LoadingRow } from 'ui/Loading/Loading';
import { AccentText, StyledText, UntitledText } from 'ui/StyledText/StyledText';
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

    return highlightedTitle && highlightedTitle !== 'Untitled' ? (
        <AccentText size="smedium" weight="bold" color="text" hover>
            <div
                className="result-item-title"
                dangerouslySetInnerHTML={{
                    __html: highlightedTitle,
                }}
            />
        </AccentText>
    ) : (
        <UntitledText size="smedium" />
    );
};

function formatHighlightStrings(strArr: string[]) {
    return strArr.join(' ... ').replace(/<\/mark>\s*<mark>/g, ' ');
}

function openClick(
    url: string,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
) {
    // cmd or middle button
    if (e.metaKey || e.button === 1) {
        window.open(url);
    } else if (e.button === 0) {
        // left click
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

    const [isQueryTextExpanded, setIsQueryTextExpanded] = useState(false);
    const isQueryCell = preview.query_type === 'query_cell';

    const url = isQueryCell
        ? `/${environmentName}/datadoc/${preview.data_doc_id}/?cellId=${id}`
        : `/${environmentName}/query_execution/${id}/`;
    const handleClick = React.useMemo(() => openClick.bind(null, url), [url]);
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const selfRef = useRef<HTMLDivElement>();

    if (loading) {
        return (
            <div className="SearchResultItem QueryItem flex-center">
                <LoadingRow />
            </div>
        );
    }

    // Query cell title is data cell title
    // Query execution title is "<title> > Execution <id>" for data cell executions
    // or "Adhoc Execution <id>" for adhoc exeuctions
    const resultTitle = isQueryCell
        ? title ?? 'Untitled'
        : `${title != null ? `${title} >` : 'Adhoc'} Execution ${id}`;

    const queryTextHighlightedContent = preview.highlight?.query_text;

    const getSyntaxHighlightedQueryDOM = () => (
        <ThemedCodeHighlight
            className="result-item-query"
            value={queryText}
            onClick={stopPropagation}
            onContextMenuCapture={stopPropagation}
        />
    );

    const getSearchResultHighlightedQueryDOM = () => (
        <div
            className="highlighted-query pl16 pr24 pv8"
            onClick={stopPropagation}
            onContextMenuCapture={stopPropagation}
        >
            <IconButton
                className="toggle-expand-query-icon"
                noPadding
                icon={isQueryTextExpanded ? 'Minimize2' : 'Maximize2'}
                size={14}
                onClick={() =>
                    setIsQueryTextExpanded((isExpaneded) => !isExpaneded)
                }
            />
            {!isQueryTextExpanded ? (
                <span
                    dangerouslySetInnerHTML={{
                        __html: formatHighlightStrings(
                            queryTextHighlightedContent
                        ),
                    }}
                />
            ) : (
                getSyntaxHighlightedQueryDOM()
            )}
        </div>
    );

    // If there are no highlighted sections in query text returned, display
    // syntax-highlighted query, otherwise allow user to toggle between
    // syntax-highlighted content and matched search results
    const queryTextDOM = !queryTextHighlightedContent
        ? getSyntaxHighlightedQueryDOM()
        : getSearchResultHighlightedQueryDOM();

    const queryEngine = queryEngineById[engineId];
    const queryType = isQueryCell ? 'query cell' : 'execution';

    return (
        <>
            <div
                className="SearchResultItem QueryItem"
                onClick={handleClick}
                ref={selfRef}
            >
                <div className="result-items">
                    <div className="result-items-top horizontal-space-between">
                        <HighlightTitle
                            title={resultTitle}
                            searchString={searchString}
                        />
                        <div>
                            <Tag mini>{queryType}</Tag>
                            {queryEngine && <Tag mini>{queryEngine.name}</Tag>}
                        </div>
                    </div>
                    <div className="mv8">{queryTextDOM}</div>
                    <Level className="result-items-bottom">
                        <span className="result-item-owner">
                            {authorInfo.username}
                        </span>
                        <StyledText size="small" color="lightest">
                            {generateFormattedDate(createdAt, 'X')}
                        </StyledText>
                    </Level>
                </div>
            </div>
            <UrlContextMenu anchorRef={selfRef} url={url} />
        </>
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
    const selfRef = useRef<HTMLDivElement>();
    const { owner_uid: ownerUid, created_at: createdAt } = preview;
    const { userInfo: ownerInfo, loading } = useUser({ uid: ownerUid });
    const handleClick = React.useMemo(() => openClick.bind(null, url), [url]);

    if (loading) {
        return (
            <div className="SearchResultItem DataDocItem flex-center">
                <LoadingRow />
            </div>
        );
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
        <>
            <div
                className="SearchResultItem DataDocItem"
                onClick={handleClick}
                ref={selfRef}
            >
                <div className="result-item-icon">
                    <UserAvatar uid={ownerUid} />
                </div>
                <div className="result-items">
                    <div className="result-items-top horizontal-space-between">
                        <HighlightTitle
                            title={title}
                            searchString={searchString}
                        />
                    </div>
                    {descriptionDOM}
                    <Level className="result-items-bottom">
                        <span className="result-item-owner">
                            {ownerInfo.username}
                        </span>
                        <StyledText size="small" color="lightest">
                            {generateFormattedDate(createdAt, 'X')}
                        </StyledText>
                    </Level>
                </div>
            </div>
            <UrlContextMenu anchorRef={selfRef} url={url} />
        </>
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
    const selfRef = useRef<HTMLDivElement>();
    const {
        golden,
        description,
        created_at: createdAt,
        name,
        schema,
        tags,
    } = preview;
    const handleClick = React.useMemo(() => openClick.bind(null, url), [url]);

    const goldenIcon = golden ? (
        <div className="result-item-golden ml4">
            <Icon className="award" name="Award" />
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

    const tagsListDOM = tags?.length ? (
        <div>
            {tags.map((tag) => (
                <Tag mini key={tag}>
                    {tag}
                </Tag>
            ))}
        </div>
    ) : null;

    return (
        <>
            <div
                className="SearchResultItem flex-row"
                onClick={handleClick}
                ref={selfRef}
            >
                <div className="result-items">
                    <div className="result-items-top horizontal-space-between">
                        <div className="flex-row">
                            <HighlightTitle
                                title={`${schema}.${name}`}
                                searchString={searchString}
                            />
                            {goldenIcon}
                        </div>
                        <StyledText size="small" color="lightest">
                            {generateFormattedDate(createdAt, 'X')}
                        </StyledText>
                    </div>
                    {tagsListDOM}
                    <Level className="result-items-bottom">
                        <span className="result-item-description">
                            {descriptionDOM}
                        </span>
                    </Level>
                </div>
            </div>
            <UrlContextMenu url={url} anchorRef={selfRef} />
        </>
    );
};

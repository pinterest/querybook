import clsx from 'clsx';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    IStatementResultTableHandles,
    StatementResultTable,
} from 'components/StatementResultTable/StatementResultTable';
import PublicConfig from 'config/querybook_public_config.yaml';
import { IStatementExecution, IStatementResult } from 'const/queryExecution';
import { StatementExecutionResultSizes } from 'const/queryResultLimit';
import { MIN_COLUMN_TO_SHOW_FILTER } from 'const/uiConfig';
import { useImmer } from 'hooks/useImmer';
import { useResource } from 'hooks/useResource';
import { useToggleState } from 'hooks/useToggleState';
import { getSelectStatementLimit } from 'lib/sql-helper/sql-limiter';
import { stopPropagation } from 'lib/utils/noop';
import { formatNumber } from 'lib/utils/number';
import { IStoreState } from 'redux/store/types';
import { QueryExecutionMetadataResource } from 'resource/queryExecution';
import { TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { InfoButton } from 'ui/Button/InfoButton';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Icon } from 'ui/Icon/Icon';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { Popover } from 'ui/Popover/Popover';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { IOptions, makeSelectOptions, Select } from 'ui/Select/Select';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { AccentText } from 'ui/StyledText/StyledText';

import './StatementResult.scss';

interface IProps {
    statementResult: IStatementResult;
    statementExecution: IStatementExecution;
    isFullscreen: boolean;
    onFullscreenToggle: () => any;

    isFetchingStatementResult: boolean;
    resultLimit: number;
    setResultLimit: (limit: number) => void;

    queryExecutionId: number;
}

export const StatementResult: React.FC<IProps> = (props) => {
    const { result_row_count: resultRowCount } = props.statementExecution;

    let loadingDOM: React.ReactNode = null;
    if (resultRowCount === 0) {
        loadingDOM = (
            <div className="statement-execution-no-output">No Output</div>
        );
    } else if (!props.statementResult) {
        loadingDOM = <Loading />;
    } else if (props.statementResult.failed) {
        loadingDOM = (
            <StatementResultWithError error={props.statementResult.error} />
        );
    }

    if (loadingDOM) {
        return <div className="StatementResult">{loadingDOM}</div>;
    }

    return <StatementResultWithResult {...props} />;
};

const StatementResultWithResult: React.FC<IProps> = ({
    statementExecution,
    statementResult,
    isFullscreen,
    onFullscreenToggle,

    isFetchingStatementResult,
    resultLimit,
    setResultLimit,

    queryExecutionId,
}) => {
    const { result_row_count: resultRowCount } = statementExecution;
    const { data: rawData } = statementResult;
    const {
        columnNames,
        columnVisibility,
        toggleColumnVisibility,
        processedData: data,
    } = useColumnVisibility(rawData);
    const statementQueryLimit =
        useStatementResultQueryLimit(statementExecution);

    const [expandAllResultColumns, setExpandAllResultColumns] = useState(false);
    const tableRef = useRef<IStatementResultTableHandles>();

    const toggleExpandAllColumns = useCallback(() => {
        setExpandAllResultColumns((old) => {
            const shouldExpand = !old;

            if (tableRef.current) {
                tableRef.current.toggleAllExpandedColumns(shouldExpand);
            }

            return shouldExpand;
        });
    }, []);

    const resultRowMinusColCount = Math.max(resultRowCount - 1, 0);
    const actualRowMinusColCount = Math.max(data.length - 1, 0);
    const fetchedAllRows = resultRowMinusColCount === actualRowMinusColCount;

    const { data: executionMetadata } = useResource(
        React.useCallback(
            () => QueryExecutionMetadataResource.get(queryExecutionId),
            [queryExecutionId]
        )
    );

    const explorationButtons = [
        <ColumnToggleMenuButton
            columnNames={columnNames}
            columnVisibility={columnVisibility}
            toggleVisibility={toggleColumnVisibility}
            key="filter-cols"
        />,
        <TextButton
            key="expand-cols"
            title={`${expandAllResultColumns ? 'Condense' : 'Full'} cell`}
            icon={expandAllResultColumns ? 'Minimize2' : 'Maximize2'}
            onClick={toggleExpandAllColumns}
            aria-label="If condensed (default), hide cell content that exceeds the width of the cell."
            data-balloon-pos="up"
            data-balloon-length="large"
            size="small"
        />,
        <TextButton
            onClick={onFullscreenToggle}
            icon={isFullscreen ? 'X' : 'Expand'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            size="small"
            key="full-screen"
        />,
    ];
    const fetchRowInfoDOM = (
        <FetchInfo
            statementQueryLimit={statementQueryLimit}
            resultRowMinusColCount={resultRowMinusColCount}
            actualRowMinusColCount={actualRowMinusColCount}
            fetchedAllRows={fetchedAllRows}
            resultLimit={resultLimit}
            setResultLimit={setResultLimit}
            isFetchingStatementResult={isFetchingStatementResult}
            sampleRate={Number(executionMetadata?.metadata?.sample_rate) ?? 0}
        />
    );
    const visualizationDOM = data.length ? (
        <StatementResultTable
            data={data}
            paginate={!isFullscreen}
            isPreview={!fetchedAllRows}
            ref={tableRef}
        />
    ) : null;

    return (
        <div
            className={clsx({
                StatementResult: true,
                fullscreen: isFullscreen,
            })}
        >
            <div className="statement-results-summary horizontal-space-between">
                {fetchRowInfoDOM}
                <div className="flex-row">{explorationButtons}</div>
            </div>
            {visualizationDOM}
        </div>
    );
};

const StatementResultWithError: React.FC<{ error: any }> = ({ error }) => {
    const stringfiedError = useMemo(() => String(error), [error]);
    return (
        <Message
            title="Cannot Load Statement Result"
            message={<ShowMoreText text={stringfiedError} seeLess />}
            type="error"
        />
    );
};

const StatementResultRowCountPicker: React.FC<{
    resultLimit: number;
    setResultLimit: (limit: number) => void;
    currentRowCount: number;
    maxRowCount: number;
}> = ({ resultLimit, setResultLimit, currentRowCount, maxRowCount }) => {
    const resultLimitOptions = useStatementResultLimitOptions(
        maxRowCount,
        currentRowCount
    );

    // Already fetched max possible, or no more limits to increase to
    if (currentRowCount < resultLimit || resultLimitOptions.length <= 1) {
        return <PrettyNumber val={currentRowCount} />;
    }

    return (
        <span className="StatementResultRowCountPicker">
            <Select
                value={resultLimit}
                onChange={(evt) => setResultLimit(Number(evt.target.value))}
            >
                {makeSelectOptions(resultLimitOptions)}
            </Select>
        </span>
    );
};

function useStatementResultLimitOptions(
    maxRowCount: number,
    currentRowCount: number
) {
    const resultLimitOptions = useMemo(() => {
        if (maxRowCount === 0) {
            return [];
        }
        const options: IOptions = [];
        for (const size of StatementExecutionResultSizes) {
            if (size < currentRowCount) {
                continue;
            }

            if (size <= maxRowCount) {
                options.push({
                    key: size,
                    value: formatNumber(size),
                });
            } else {
                options.push({
                    key: maxRowCount,
                    value: 'All',
                });
                break;
            }
        }
        return options;
    }, [maxRowCount, currentRowCount]);

    return resultLimitOptions;
}

const FetchInfo: React.FC<{
    statementQueryLimit: number;
    resultRowMinusColCount: number;
    actualRowMinusColCount: number;
    fetchedAllRows: boolean;

    resultLimit: number;
    setResultLimit: (newLimit: number) => void;
    isFetchingStatementResult: boolean;

    sampleRate: number;
}> = ({
    statementQueryLimit,
    resultRowMinusColCount,
    actualRowMinusColCount,
    fetchedAllRows,

    resultLimit,
    setResultLimit,
    isFetchingStatementResult,

    sampleRate,
}) => {
    const getFetchInfo = () => {
        if (isFetchingStatementResult) {
            return (
                <div className="flex-row">
                    Fetching statement results
                    <Icon name="Loading" size={16} className="ml4" />
                </div>
            );
        }

        const sampleUserGuideLink =
            PublicConfig.table_sampling?.sample_user_guide_link ?? '';
        const sampleRateText = (
            <div className="flex-row ml4">
                (Full Result,
                <span className="accent-warning-text ml4">
                    Sampled {sampleRate}%
                </span>
                {sampleUserGuideLink ? (
                    <IconButton
                        className="ml4"
                        onClick={() => {
                            window.open(sampleUserGuideLink, '_blank');
                        }}
                        icon="Info"
                        size={16}
                        noPadding
                    />
                ) : null}
                )
            </div>
        );

        const limitReachedText =
            statementQueryLimit === resultRowMinusColCount ? (
                <AccentText
                    className="flex-row warning-word ml4"
                    tooltip={
                        'The number of rows returned matches exactly with the LIMIT in query'
                    }
                    data-balloon-length="medium"
                >
                    Limited by query
                </AccentText>
            ) : null;

        if (fetchedAllRows) {
            return (
                <span className="flex-row">
                    {formatNumber(actualRowMinusColCount, 'row')}
                    {sampleRate > 0 ? sampleRateText : ' (Full Result)'}
                    {limitReachedText}
                </span>
            );
        }

        const resultPreviewTooltip = `Use Export to download full result (${formatNumber(
            resultRowMinusColCount,
            'row'
        )})`;

        return (
            <div className="flex-row">
                <InfoButton>{resultPreviewTooltip}</InfoButton>
                <span className="warning-word mr4">Previewing</span>
                <span className="mr4">
                    <StatementResultRowCountPicker
                        resultLimit={resultLimit}
                        setResultLimit={setResultLimit}
                        maxRowCount={resultRowMinusColCount}
                        currentRowCount={actualRowMinusColCount}
                    />
                    <span className="mh4">of</span>
                    <PrettyNumber val={resultRowMinusColCount} unit="row" />
                </span>
                {actualRowMinusColCount < resultLimit && (
                    <span className="warning-word">
                        (Cannot fetch more rows due to size limit)
                    </span>
                )}
                {limitReachedText && limitReachedText}
            </div>
        );
    };

    return (
        <span
            className={clsx({
                'number-of-rows-message': true,
                'more-rows-than-shown': !fetchedAllRows,
            })}
        >
            {getFetchInfo()}
        </span>
    );
};

function useColumnVisibility(data: string[][]) {
    const columnNames = data[0];

    const [columnVisibility, setColumnVisibility] = useImmer(() =>
        columnNames.reduce<Record<string, boolean>>((hash, colName) => {
            hash[colName] = true;
            return hash;
        }, {})
    );
    const toggleColumnVisibility = useCallback(
        (colName: string) => {
            setColumnVisibility((draft) => {
                draft[colName] = !draft[colName];
            });
        },
        [setColumnVisibility]
    );

    const processedData = useMemo(() => {
        const hideColumnAtIndex = new Set(
            columnNames.reduce<number[]>((arr, colName, idx) => {
                if (!columnVisibility[colName]) {
                    arr.push(idx);
                }
                return arr;
            }, [])
        );

        if (hideColumnAtIndex.size === 0) {
            return data;
        }

        return data.map((row) =>
            row.filter((_, colIdx) => !hideColumnAtIndex.has(colIdx))
        );
    }, [columnNames, columnVisibility, data]);

    return {
        columnNames,
        columnVisibility,
        toggleColumnVisibility,
        processedData,
    };
}

function useStatementResultQueryLimit(statementExecution: IStatementExecution) {
    const queryExecution = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.queryExecutionById[
                statementExecution.query_execution_id
            ]
    );
    const statementStr = useMemo(
        () =>
            queryExecution.query.slice(
                statementExecution.statement_range_start,
                statementExecution.statement_range_end
            ),
        [statementExecution, queryExecution]
    );
    return useMemo(() => getSelectStatementLimit(statementStr), [statementStr]);
}

const ColumnToggleMenuButton: React.FC<{
    columnNames: string[];
    columnVisibility: Record<string, boolean>;
    toggleVisibility: (col: string) => void;
}> = ({ columnNames, columnVisibility, toggleVisibility }) => {
    const buttonRef = React.useRef<HTMLAnchorElement>();
    const [showPopover, _, toggleShowPopover] = useToggleState(false);
    const [keyword, setKeyword] = useState('');
    const filteredColumnNames = useMemo(
        () =>
            keyword === ''
                ? columnNames
                : columnNames.filter((names) =>
                      names.toLowerCase().includes(keyword.toLowerCase())
                  ),
        [columnNames, keyword]
    );
    const isAllSelected = useMemo(
        () => columnNames.every((columnName) => columnVisibility[columnName]),
        [columnNames, columnVisibility]
    );

    const getPopoverContent = () => (
        <div className="StatementResult-column-toggle-menu">
            {columnNames.length >= MIN_COLUMN_TO_SHOW_FILTER && (
                <div onClick={stopPropagation}>
                    <SearchBar
                        value={keyword}
                        onSearch={setKeyword}
                        placeholder="Search"
                        transparent
                        delayMethod="throttle"
                        hasClearSearch={true}
                    />
                </div>
            )}

            <div key="all">
                <Checkbox
                    title={
                        (isAllSelected ? 'Hide All' : 'Select All') +
                        (keyword === '' ? '' : ' Visible')
                    }
                    value={isAllSelected}
                    onChange={() => {
                        if (isAllSelected) {
                            filteredColumnNames.map((col) =>
                                toggleVisibility(col)
                            );
                        } else {
                            filteredColumnNames
                                .filter((col) => !columnVisibility[col])
                                .map((column) => toggleVisibility(column));
                        }
                    }}
                />
            </div>
            {filteredColumnNames.map((columnName) => (
                <div key={columnName}>
                    <Checkbox
                        title={columnName}
                        value={columnVisibility[columnName]}
                        onChange={() => toggleVisibility(columnName)}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <TextButton
            title="Hide Columns"
            icon="Filter"
            ref={buttonRef}
            onClick={toggleShowPopover}
            size="small"
        >
            {showPopover && (
                <Popover
                    anchor={buttonRef.current}
                    layout={['bottom', 'left']}
                    onHide={toggleShowPopover}
                    resizeOnChange
                >
                    {getPopoverContent()}
                </Popover>
            )}
        </TextButton>
    );
};

import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';

import { QueryExecutionPicker } from 'components/ExecutionPicker/QueryExecutionPicker';
import { QueryExecution } from 'components/QueryExecution/QueryExecution';
import { QueryExecutionDuration } from 'components/QueryExecution/QueryExecutionDuration';
import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import { DataDocContext } from 'context/DataDoc';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { getQueryString } from 'lib/utils/query-string';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import * as queryExecutionsSelectors from 'redux/queryExecutions/selector';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    docId: number;
    cellId: number;
    isQueryCollapsed: boolean;

    changeCellContext?: (context: string, run?: boolean) => void;

    onSamplingInfoClick?: () => void;
    hasSamplingTables?: boolean;
    sampleRate: number;
}

export const DataDocQueryExecutions: React.FunctionComponent<IProps> =
    React.memo(
        ({
            cellId,
            docId,
            changeCellContext,
            isQueryCollapsed,
            onSamplingInfoClick,
            hasSamplingTables,
            sampleRate,
        }) => {
            const { cellIdToExecutionId, onQueryCellSelectExecution } =
                useContext(DataDocContext);

            const queryExecutions =
                useMakeSelector(
                    queryExecutionsSelectors.makeQueryExecutionsSelector,
                    cellId
                ) ?? [];
            const selectedExecutionIndex = useMemo(() => {
                if (!(cellId in cellIdToExecutionId)) {
                    return 0;
                }

                const foundIndex = queryExecutions.findIndex(
                    (qe) => qe.id === cellIdToExecutionId[cellId]
                );
                // If not found, then return 0
                return Math.max(0, foundIndex);
            }, [cellIdToExecutionId[cellId], queryExecutions]);

            const selectExecutionIndex = useCallback(
                (index: number) => {
                    if (queryExecutions.length > index) {
                        onQueryCellSelectExecution(
                            cellId,
                            queryExecutions[index].id
                        );
                    }
                },
                [queryExecutions]
            );

            const dispatch = useDispatch();
            useEffect(() => {
                dispatch(
                    queryExecutionsActions.fetchQueryExecutionsByCell(cellId)
                );
            }, [cellId]);

            useEffect(() => {
                selectExecutionIndex(0);
            }, [queryExecutions.length]);

            const [usedQueryParam, setUsedQueryParam] = useState(false);
            useEffect(() => {
                if (!usedQueryParam && queryExecutions.length) {
                    const queryParam = getQueryString();
                    if (
                        'executionId' in queryParam &&
                        queryParam['executionId']
                    ) {
                        const executionId = Number(queryParam['executionId']);
                        for (const [
                            index,
                            queryExecution,
                        ] of queryExecutions.entries()) {
                            if (queryExecution.id === executionId) {
                                selectExecutionIndex(index);
                            }
                        }
                    }
                    setUsedQueryParam(true);
                }
            }, [queryExecutions, usedQueryParam]);

            const handleQueryExecutionSelected = useCallback(
                (qid: number) => {
                    const newIndex = queryExecutions.findIndex(
                        ({ id }) => qid === id
                    );
                    if (newIndex >= 0) {
                        selectExecutionIndex(newIndex);
                    }
                },
                [queryExecutions]
            );

            const generateExecutionsPickerDOM = () => {
                const currentExecution =
                    queryExecutions?.[selectedExecutionIndex];
                if (!currentExecution) {
                    return null;
                }

                return (
                    <div className="execution-selector-section horizontal-space-between">
                        <div className="flex-row">
                            <QueryExecutionPicker
                                queryExecutionId={currentExecution?.id}
                                onSelection={handleQueryExecutionSelected}
                                queryExecutions={queryExecutions}
                            />
                            <div className="ml8">
                                <QueryExecutionDuration
                                    queryExecution={currentExecution}
                                />
                            </div>
                        </div>
                        <div className="execution-selector-bottom flex-row">
                            <QueryExecutionBar
                                queryExecution={currentExecution}
                            />
                        </div>
                    </div>
                );
            };

            const selectedExecution = queryExecutions[selectedExecutionIndex];
            const queryExecutionDOM = selectedExecution && (
                <QueryExecution
                    id={selectedExecution.id}
                    docId={docId}
                    key={selectedExecution.id}
                    changeCellContext={changeCellContext}
                    onSamplingInfoClick={onSamplingInfoClick}
                    hasSamplingTables={hasSamplingTables}
                    sampleRate={sampleRate}
                />
            );

            const placeholderIfNoExecutionsDOM = isQueryCollapsed &&
                !queryExecutionDOM && (
                    <div>
                        Note: This query is collapsed, but it doesn't yet have
                        an execution.
                        <br />
                        You can either run it, or edit it by clicking on the
                        ellipsis button on the top right and then on "Show
                        Query".
                    </div>
                );

            return (
                <div className="DataDocQueryExecutions">
                    <StyledText size="xsmall">
                        {generateExecutionsPickerDOM()}
                        {queryExecutionDOM}
                        {placeholderIfNoExecutionsDOM}
                    </StyledText>
                </div>
            );
        }
    );

import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
    useContext,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { getQueryString } from 'lib/utils/query-string';

import { currentEnvironmentSelector } from 'redux/environment/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import * as queryExecutionsSelectors from 'redux/queryExecutions/selector';

import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import { QueryExecution } from 'components/QueryExecution/QueryExecution';

import './DataDocQueryExecutions.scss';
import { QueryExecutionPicker } from 'components/ExecutionPicker/QueryExecutionPicker';
import { DataDocContext } from 'context/DataDoc';

interface IProps {
    docId: number;
    cellId: number;
    isQueryCollapsed: boolean;

    changeCellContext: (context: string) => any;
}

export const DataDocQueryExecutions: React.FunctionComponent<IProps> = React.memo(
    ({ cellId, docId, changeCellContext, isQueryCollapsed }) => {
        const { cellIdToExecutionId, onQueryCellSelectExecution } = useContext(
            DataDocContext
        );

        const environment = useSelector(currentEnvironmentSelector);

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
            dispatch(queryExecutionsActions.fetchQueryExecutionsByCell(cellId));
        }, [cellId]);

        React.useEffect(() => {
            selectExecutionIndex(0);
        }, [queryExecutions.length]);

        const [usedQueryParam, setUsedQueryParam] = useState(false);
        useEffect(() => {
            if (!usedQueryParam) {
                const queryParam = getQueryString();
                if ('executionId' in queryParam && queryParam['executionId']) {
                    const executionId = Number(queryParam['executionId']);
                    for (const [
                        index,
                        queryExecution,
                    ] of queryExecutions.entries()) {
                        if (queryExecution.id === executionId) {
                            selectExecutionIndex(index);
                            setUsedQueryParam(true);
                        }
                    }
                }
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

        const generatePermaLink = useCallback(() => {
            const queryExecution = (queryExecutions || [])[
                selectedExecutionIndex
            ];
            if (queryExecution) {
                const shareUrl = `${location.protocol}//${location.host}/${environment.name}/query_execution/${queryExecution.id}/`;
                return shareUrl;
            }
            return '';
        }, [queryExecutions, selectedExecutionIndex]);

        const generateExecutionsPickerDOM = () => {
            const currentExecution = queryExecutions?.[selectedExecutionIndex];
            if (!currentExecution) {
                return null;
            }

            return (
                <div className="execution-selector-section flex-row">
                    <QueryExecutionPicker
                        queryExecutionId={currentExecution?.id}
                        onSelection={handleQueryExecutionSelected}
                        queryExecutions={queryExecutions}
                    />
                    <div className="execution-selector-bottom flex-row">
                        <QueryExecutionBar
                            queryExecution={currentExecution}
                            permalink={generatePermaLink()}
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
            />
        );

        const placeholderIfNoExecutionsDOM = isQueryCollapsed &&
            !queryExecutionDOM && (
                <div>
                    Note: This query is collapsed, but it doesn't yet have an
                    execution.
                    <br />
                    You can either run it, or edit it by clicking on the
                    ellipsis button on the top right and then on "Show Query".
                </div>
            );

        return (
            <div className="DataDocQueryExecutions">
                {generateExecutionsPickerDOM()}
                {queryExecutionDOM}
                {placeholderIfNoExecutionsDOM}
            </div>
        );
    }
);

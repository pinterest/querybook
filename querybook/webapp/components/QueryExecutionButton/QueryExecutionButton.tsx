import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { TooltipDirection } from 'const/tooltip';
import { fetchActiveQueryExecutionForUser } from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { QueryExecutionStatus } from 'const/queryExecution';
import { IconButton } from 'ui/Button/IconButton';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import './QueryExecutionButton.scss';

interface IQueryExecutionButtonProps {
    tooltipPos?: TooltipDirection;
    onClick: () => any;
    active?: boolean;
}

function useActiveQueryExecutions() {
    const [loading, setLoading] = useState(true);

    const { queryExecutionById, uid, queryEnginesInEnv } = useShallowSelector(
        (state: IStoreState) => ({
            queryExecutionById: state.queryExecutions.queryExecutionById,
            uid: state.user.myUserInfo.uid,
            queryEnginesInEnv:
                state.environment.environmentEngineIds[
                    state.environment.currentEnvironmentId
                ] ?? [],
        })
    );

    const activeQueryExecutions = useMemo(
        () =>
            Object.values(queryExecutionById).filter(
                (queryExecution) =>
                    // filter by query executions only in the current environment
                    queryEnginesInEnv.includes(queryExecution.engine_id) &&
                    queryExecution.status < QueryExecutionStatus.DONE
            ),
        [queryExecutionById, queryEnginesInEnv]
    );

    const dispatch: Dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchActiveQueryExecutionForUser(uid)).then(() => {
            setLoading(false);
        });
    }, []);

    return {
        loading,
        activeQueryExecutions,
    };
}

export const QueryExecutionButton = React.memo<IQueryExecutionButtonProps>(
    ({ tooltipPos = 'right', onClick, active }) => {
        const { loading, activeQueryExecutions } = useActiveQueryExecutions();

        const buttonTitle = loading
            ? 'Checking running queries'
            : activeQueryExecutions.length > 0
            ? `You have ${activeQueryExecutions.length} running queries.`
            : 'No running queries.';

        return (
            <>
                <span className="QueryExecutionButton">
                    <IconButton
                        onClick={onClick}
                        tooltip={buttonTitle}
                        tooltipPos={tooltipPos}
                        icon={'list'}
                        active={active}
                        ping={
                            activeQueryExecutions.length > 0
                                ? activeQueryExecutions.length.toString()
                                : null
                        }
                        title="Runs"
                    />
                </span>
            </>
        );
    }
);

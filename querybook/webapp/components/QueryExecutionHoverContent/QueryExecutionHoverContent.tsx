import * as React from 'react';
import { useDispatch } from 'react-redux';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { QueryExecutionStatus } from 'const/queryExecution';
import { queryStatusToStatusIcon } from 'const/queryStatus';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { generateFormattedDate } from 'lib/utils/datetime';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { fetchQueryExecutionIfNeeded } from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Loader } from 'ui/Loader/Loader';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';

interface IProps {
    queryExecutionId: number;
    title: string;
}

export const QueryExecutionHoverContent: React.FunctionComponent<IProps> = ({
    queryExecutionId,
    title,
}) => {
    const dispatch: Dispatch = useDispatch();

    const { queryExecution, queryEngineById } = useShallowSelector(
        (state: IStoreState) => ({
            queryExecution:
                state.queryExecutions.queryExecutionById[queryExecutionId],
            queryEngineById: queryEngineByIdEnvSelector(state),
        })
    );

    const getQueryExecution = React.useCallback(() => {
        dispatch(fetchQueryExecutionIfNeeded(queryExecutionId));
    }, [queryExecutionId]);

    const renderQueryExecutionView = () => {
        const {
            status,
            completed_at: completedAt,
            engine_id: engineId,
            uid,
        } = queryExecution;
        const completedAtDate = generateFormattedDate(completedAt);
        return (
            <>
                <UserBadge uid={uid} mini />
                <div className="flex-row">
                    <StatusIcon
                        status={queryStatusToStatusIcon[queryExecution.status]}
                    />
                    <Tag className="ml8" mini light>
                        {queryEngineById[engineId].name}
                    </Tag>
                </div>
                {status === QueryExecutionStatus.DONE && (
                    <StyledText
                        size="xsmall"
                        className="BoardHoverContent-date mt4"
                    >
                        Completed {completedAtDate}
                    </StyledText>
                )}
            </>
        );
    };
    return (
        <div className="QueryExecutionHoverContent">
            <Title className="mb4" size="smedium">
                {title}
            </Title>
            <Loader
                item={queryExecution}
                itemKey={queryExecutionId}
                itemLoader={getQueryExecution}
                renderer={renderQueryExecutionView}
            />
        </div>
    );
};

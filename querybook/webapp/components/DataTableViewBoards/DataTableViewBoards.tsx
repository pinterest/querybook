import React from 'react';
import { useSelector } from 'react-redux';

import { IDataTable } from 'const/metastore';
import { EmptyText } from 'ui/StyledText/StyledText';
import { BoardResource } from 'resource/board';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Loading } from 'ui/Loading/Loading';
import { BoardDetailedList } from 'components/BoardDetailedList/BoardDetailedList';
import { useResource } from 'hooks/useResource';

export interface IDataTableViewBoardsProps {
    table: IDataTable;
}

export const DataTableViewBoards: React.FunctionComponent<
    IDataTableViewBoardsProps
> = ({ table }) => {
    const environment = useSelector(currentEnvironmentSelector);

    const { data: boards, isLoading } = useResource(
        React.useCallback(
            () =>
                BoardResource.getItemBoards(environment.id, 'table', table.id),
            [environment.id, table.id]
        )
    );

    const noBoardsDOM = (
        <EmptyText className="m24">No lists available.</EmptyText>
    );

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="DataTableViewBoards">
            {boards.length ? (
                <BoardDetailedList boards={boards} />
            ) : (
                noBoardsDOM
            )}
        </div>
    );
};

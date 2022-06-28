import React from 'react';
import { useSelector } from 'react-redux';

import { IDataTable } from 'const/metastore';
import { EmptyText } from 'ui/StyledText/StyledText';
import { BoardResource } from 'resource/board';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Loading } from 'ui/Loading/Loading';
import { BoardDetailedList } from 'components/BoardDetailedList/BoardDetailedList';
import { useResource } from 'hooks/useResource';

export interface IDataTableViewListsProps {
    table: IDataTable;
}

export const DataTableViewLists: React.FunctionComponent<
    IDataTableViewListsProps
> = ({ table }) => {
    const environment = useSelector(currentEnvironmentSelector);

    const { data: boards, isLoading } = useResource(
        React.useCallback(
            () =>
                BoardResource.getItemBoards(environment.id, 'table', table.id),
            [environment.id, table.id]
        )
    );

    const noListsDOM = (
        <EmptyText className="m24">No lists available.</EmptyText>
    );

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="DataTableViewLists">
            {boards.length ? <BoardDetailedList boards={boards} /> : noListsDOM}
        </div>
    );
};

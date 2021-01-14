import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchTopQueryUsersIfNeeded } from 'redux/dataSources/action';

import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { Loading } from 'ui/Loading/Loading';

export function useLoadQueryUsers(tableId: number) {
    const [loading, setLoading] = useState(false);
    const topQueryUsers = useSelector(
        (state: IStoreState) =>
            state.dataSources.queryTopUsersByTableId[tableId]
    );

    const dispatch: Dispatch = useDispatch();

    useEffect(() => {
        setLoading(true);
        dispatch(fetchTopQueryUsersIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);

    return {
        loading,
        topQueryUsers,
    };
}

export const DataTableViewQueryUsers: React.FC<{
    tableId: number;
    onClick?: (uid: number) => any;
}> = ({ tableId, onClick = null }) => {
    const { loading, topQueryUsers } = useLoadQueryUsers(tableId);
    const userInfoById = useSelector(
        (state: IStoreState) => state.user.userInfoById
    );

    const viewersDOM = loading ? (
        <Loading />
    ) : !topQueryUsers?.length ? (
        <div>No user has queried this table on Querybook.</div>
    ) : (
        <UserAvatarList
            users={topQueryUsers.map((topQueryUser) => ({
                uid: topQueryUser.uid,
                onClick: onClick ? () => onClick(topQueryUser.uid) : null,
                tooltip: `${
                    userInfoById[topQueryUser.uid]?.username ?? 'Loading'
                }, query count ${topQueryUser.count}`,
            }))}
        />
    );

    return (
        <div className="DataTableViewQueryUsers">
            {topQueryUsers?.length ? (
                <div>Click on a user to see their queries</div>
            ) : null}
            <div className="DataTableViewQueryUsers-users center-align">
                {viewersDOM}
            </div>
        </div>
    );
};

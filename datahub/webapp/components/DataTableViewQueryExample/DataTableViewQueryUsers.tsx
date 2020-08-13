import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchTopQueryUsersIfNeeded } from 'redux/dataSources/action';

import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { Loading } from 'ui/Loading/Loading';

export const DataTableViewQueryUsers: React.FC<{
    tableId: number;
}> = ({ tableId }) => {
    const [loading, setLoading] = useState(false);
    const topQueryUsers = useSelector(
        (state: IStoreState) =>
            state.dataSources.queryTopUsersByTableId[tableId]
    );
    const userInfoById = useSelector(
        (state: IStoreState) => state.user.userInfoById
    );
    const dispatch: Dispatch = useDispatch();

    useEffect(() => {
        setLoading(true);
        dispatch(fetchTopQueryUsersIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);

    const viewersDOM = loading ? (
        <Loading />
    ) : !topQueryUsers?.length ? (
        <div>No user has queried this table on DataHub.</div>
    ) : (
        <UserAvatarList
            users={topQueryUsers.map((topQueryUser) => ({
                uid: topQueryUser.uid,
                tooltip: `${
                    userInfoById[topQueryUser.uid]?.username ?? 'Loading'
                }, query count ${topQueryUser.count}`,
            }))}
        />
    );

    return (
        <div className="DataTableViewQueryUsers center-align">{viewersDOM}</div>
    );
};

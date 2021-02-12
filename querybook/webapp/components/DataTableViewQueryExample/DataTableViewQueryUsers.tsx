import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { getAppName } from 'lib/utils/global';
import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchTopQueryUsersIfNeeded } from 'redux/dataSources/action';

import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { Loading } from 'ui/Loading/Loading';
import { Button } from 'ui/Button/Button';
import { UserBadge } from 'components/UserBadge/UserBadge';

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
    selectedUid?: number;
}> = ({ tableId, onClick = null, selectedUid }) => {
    const { loading, topQueryUsers } = useLoadQueryUsers(tableId);

    const viewersDOM = loading ? (
        <Loading />
    ) : !topQueryUsers?.length ? (
        <div>No user has queried this table on {getAppName()}.</div>
    ) : (
        <div className="query-filter-wrapper">
            {topQueryUsers.map(({ uid, count }) => (
                <QueryUserButton
                    key={uid}
                    uid={uid}
                    queryCount={count}
                    onClick={onClick}
                    active={selectedUid === uid}
                />
            ))}
        </div>
    );

    return <div className="DataTableViewQueryUsers">{viewersDOM}</div>;
};

const QueryUserButton: React.FC<{
    uid: number;
    onClick?: (uid: number) => void;
    queryCount: number;
    active: boolean;
}> = ({ uid, onClick, queryCount, active }) => {
    const handleClick = useCallback(() => onClick?.(uid), [onClick, uid]);

    return (
        <Button onClick={handleClick} active={active}>
            <UserBadge uid={uid} mini />
            <span className="ml4">({queryCount})</span>
        </Button>
    );
};

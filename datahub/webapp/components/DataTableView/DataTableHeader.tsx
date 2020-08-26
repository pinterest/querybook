import React from 'react';
import { last } from 'lodash';
import { useSelector } from 'react-redux';

import ds from 'lib/datasource';
import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'redux/user/types';
import { IStoreState } from 'redux/store/types';
import { IDataTable } from 'const/metastore';
import { useDataFetch } from 'hooks/useDataFetch';

import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { Button } from 'ui/Button/Button';
import { Level } from 'ui/Level/Level';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { UserBadge } from 'components/UserBadge/UserBadge';

import './DataTableHeader.scss';

export interface IDataTableHeader {
    table: IDataTable;
    userInfo: IMyUserInfo;
    tableName: string;
    updateDataTableGolden: (golden: boolean) => any;
}

interface ITableOwnership {
    data_table_id: number;
    owner: string;
    created_at: number;
}

export const DataTableHeader: React.FunctionComponent<IDataTableHeader> = ({
    table,
    tableName,
    userInfo,

    updateDataTableGolden,
}) => {
    const {
        data: tableOwnerships,
        forceFetch: loadTableOwnerships,
    }: { data: ITableOwnership[]; forceFetch } = useDataFetch({
        url: `/table/${table.id}/ownership/`,
    });
    const username: string = useSelector(
        (state: IStoreState) => state.user.userInfoById[userInfo.uid].username
    );
    const dbTableOwner = (table.owner || '').split('@')[0];

    const isDBTableOwner = dbTableOwner === username;
    const isTableOwner = (tableOwnerships || []).find(
        (ownership) => ownership.owner === username
    );

    const shortTableName = React.useMemo(
        () =>
            Utils.generateNameFromKey(
                last(((table || ({} as any)).name || '').split('.'))
            ),
        [table]
    );

    const createTableOwnership = React.useCallback(async () => {
        await ds.save(`/table/${table.id}/ownership/`, {
            uid: userInfo.uid,
        });
        loadTableOwnerships();
    }, [table.id, userInfo.uid]);
    const deleteTableOwnership = React.useCallback(async () => {
        await ds.delete(`/table/${table.id}/ownership/`, {
            uid: userInfo.uid,
        });
        loadTableOwnerships();
    }, [table.id, userInfo.uid]);

    const titleDOM = (
        <Level className="mb4">
            <div>
                <Title className="pb12">
                    {shortTableName}
                    <BoardItemAddButton
                        size={16}
                        itemType="table"
                        itemId={table.id}
                        className="ml4"
                    />
                </Title>
                <Title subtitle size={5}>
                    {tableName}
                </Title>
            </div>
        </Level>
    );

    const ownershipDOM = (tableOwnerships || []).map((ownership) => (
        <UserBadge name={ownership.owner} mini />
    ));

    // Ownership cannot be removed if owner in db
    const ownerDOM = (
        <div className="DataTableHeader-owner">
            {dbTableOwner || tableOwnerships?.length ? (
                <div className="DataTableHeader-owner-list flex-row mb8">
                    <span className="mr8">by</span>
                    {dbTableOwner && <UserBadge name={dbTableOwner} mini />}
                    {ownershipDOM}
                </div>
            ) : null}
            {isDBTableOwner ? null : isTableOwner ? (
                <Button
                    title={'Remove table ownership'}
                    icon="user-minus"
                    type="soft"
                    onClick={deleteTableOwnership}
                    small
                />
            ) : (
                <Button
                    title={'Claim table'}
                    icon="user-plus"
                    type="soft"
                    onClick={createTableOwnership}
                    small
                />
            )}
        </div>
    );

    // TODO: add views badge && user badge back
    const viewsBadgeDOM = (
        <ImpressionWidget itemId={table.id} type={'DATA_TABLE'} />
    );

    let featuredBadge;
    if (userInfo.isAdmin) {
        featuredBadge = (
            <ToggleButton
                checked={table.golden}
                onClick={updateDataTableGolden}
                title={table.golden ? 'Featured' : 'Make Featured'}
                small
            />
        );
    } else if (table.golden) {
        featuredBadge = <Tag>Featured</Tag>;
    }

    return (
        <div className="DataTableHeader p24">
            <div className="DataTableHeader-top ">
                <div className="DataTableHeader-title">{titleDOM}</div>
                {/* <div className="DataTableHeader-score"></div> */}
            </div>
            <div className="DataTableHeader-bottom ">
                <div className="DataTableHeader-left">
                    {ownerDOM}
                    {/* <div className="DataTableHeader-tags"></div> */}
                </div>
                <div className="DataTableHeader-right">
                    <div className="DataTableHeader-featured flex-row mb8">
                        {featuredBadge}
                    </div>
                    {viewsBadgeDOM}
                </div>
            </div>
        </div>
    );
};

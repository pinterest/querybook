import React from 'react';
import { last } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';

import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'const/user';
import { IStoreState, Dispatch } from 'redux/store/types';
import { IDataTable } from 'const/metastore';
import {
    fetchDataTableOwnershipIfNeeded,
    deleteDataTableOwnership,
    createDataTableOwnership,
} from 'redux/dataSources/action';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { UserBadge } from 'components/UserBadge/UserBadge';

import { IconButton } from 'ui/Button/IconButton';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';

import './DataTableHeader.scss';

export interface IDataTableHeader {
    table: IDataTable;
    userInfo: IMyUserInfo;
    tableName: string;
    updateDataTableGolden: (golden: boolean) => any;
}

export const DataTableHeader: React.FunctionComponent<IDataTableHeader> = ({
    table,
    tableName,
    userInfo,

    updateDataTableGolden,
}) => {
    const dispatch: Dispatch = useDispatch();
    const loadTableOwnerships = React.useCallback(
        () => dispatch(fetchDataTableOwnershipIfNeeded(table.id)),
        [table.id]
    );
    const createTableOwnership = React.useCallback(
        () => dispatch(createDataTableOwnership(table.id)),
        [table.id, userInfo.uid]
    );
    const deleteTableOwnership = React.useCallback(
        () => dispatch(deleteDataTableOwnership(table.id)),
        [table.id, userInfo.uid]
    );

    const { username, tableOwnerships } = useSelector((state: IStoreState) => ({
        username: state.user.userInfoById[userInfo.uid].username,
        tableOwnerships:
            state.dataSources.dataTableOwnershipByTableId[table.id],
    }));
    const dbTableOwner = (table.owner || '').split('@')[0];
    const isDBTableOwner = dbTableOwner === username;
    const isTableOwner = (tableOwnerships || []).find(
        (ownership) => ownership.uid === userInfo.uid
    );

    const shortTableName = Utils.generateNameFromKey(
        last(((table || ({} as any)).name || '').split('.'))
    );

    React.useEffect(() => {
        loadTableOwnerships();
    }, []);

    let featuredBadge: React.ReactNode;
    if (userInfo.isAdmin) {
        featuredBadge = (
            <ToggleButton
                checked={table.golden}
                onClick={updateDataTableGolden}
                title={table.golden ? 'Featured' : 'Make Featured'}
                size="small"
            />
        );
    } else if (table.golden) {
        featuredBadge = <Tag>Featured</Tag>;
    }

    const iconDOM = (
        <div className="flex-row">
            <BoardItemAddButton
                size={16}
                itemType="table"
                itemId={table.id}
                className="mr16"
                popoverLayout={['left', 'top']}
            />
            <div className="mr24 flex-center">
                <ImpressionWidget itemId={table.id} type={'DATA_TABLE'} />
            </div>
            {featuredBadge}
        </div>
    );

    const topDOM = (
        <div className="DataTableHeader-top horizontal-space-between">
            <div className="table-key">{tableName}</div>
            {iconDOM}
        </div>
    );

    const titleDOM = (
        <Title className="table-title mb12">{shortTableName}</Title>
    );

    const ownershipDOM = (tableOwnerships || []).map((ownership) => (
        <UserBadge key={ownership.uid} uid={ownership.uid} mini />
    ));

    // Ownership cannot be removed if owner in db
    const ownerDOM = (
        <div className="DataTableHeader-owner mb8">
            <div className="DataTableHeader-owner-list flex-row ">
                <span className="header-subtitle mr16">Owners</span>
                <div className="owner-badges mr8 flex-row">
                    {dbTableOwner || tableOwnerships?.length ? (
                        <>
                            {dbTableOwner && (
                                <UserBadge name={dbTableOwner} mini />
                            )}
                            {ownershipDOM}
                        </>
                    ) : null}
                    {isDBTableOwner ? null : isTableOwner ? (
                        <IconButton
                            tooltip={'Remove my table ownership'}
                            tooltipPos="down"
                            icon="user-minus"
                            size={18}
                            onClick={deleteTableOwnership}
                            invertCircle
                        />
                    ) : (
                        <IconButton
                            tooltip={
                                dbTableOwner || tableOwnerships?.length
                                    ? 'Add myself as an additional owner'
                                    : 'Add myself as an owner'
                            }
                            tooltipPos="down"
                            icon="user-plus"
                            size={18}
                            onClick={createTableOwnership}
                            invertCircle
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const tagDOM = (
        <div className="flex-row">
            <div className="header-subtitle mr16">Tags</div>
            <DataTableTags tableId={table.id} />
        </div>
    );

    return (
        <div className="DataTableHeader flex-column mb16">
            {topDOM}
            {titleDOM}
            {ownerDOM}
            {tagDOM}
        </div>
    );
};

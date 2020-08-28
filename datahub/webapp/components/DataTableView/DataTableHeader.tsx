import React from 'react';
import { last } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';

import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'redux/user/types';
import { IStoreState, Dispatch } from 'redux/store/types';
import { IDataTable } from 'const/metastore';
import {
    fetchDataTableOwnershipIfNeeded,
    deleteDataTableOwnership,
    createDataTableOwnership,
} from 'redux/dataSources/action';

import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { Button } from 'ui/Button/Button';
import { Level } from 'ui/Level/Level';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { UserBadge } from 'components/UserBadge/UserBadge';

import './DataTableHeader.scss';
import { IconButton } from 'ui/Button/IconButton';

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
        () => dispatch(createDataTableOwnership(table.id, userInfo.uid)),
        [table.id, userInfo.uid]
    );
    const deleteTableOwnership = React.useCallback(
        () => dispatch(deleteDataTableOwnership(table.id, userInfo.uid)),
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
        <UserBadge uid={ownership.uid} mini />
    ));

    // Ownership cannot be removed if owner in db
    const ownerDOM = (
        <div className="DataTableHeader-owner">
            <div className="DataTableHeader-owner-list flex-row mb8">
                {dbTableOwner || tableOwnerships?.length ? (
                    <>
                        <span className="mr8">by</span>
                        {dbTableOwner && <UserBadge name={dbTableOwner} mini />}
                        {ownershipDOM}
                    </>
                ) : null}
                {isDBTableOwner ? null : isTableOwner ? (
                    <IconButton
                        tooltip={'Remove my table ownership'}
                        tooltipPos="right"
                        icon="user-minus"
                        size={18}
                        onClick={deleteTableOwnership}
                        invertCircle
                    />
                ) : (
                    <IconButton
                        tooltip={'Claim table'}
                        tooltipPos="right"
                        icon="user-plus"
                        size={18}
                        onClick={createTableOwnership}
                        invertCircle
                    />
                )}
            </div>
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

import { last } from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { UserBadge } from 'components/UserBadge/UserBadge';
import {
    IDataTable,
    IQueryMetastore,
    MetadataMode,
    MetadataType,
} from 'const/metastore';
import { IMyUserInfo } from 'const/user';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import * as Utils from 'lib/utils';
import {
    createDataTableOwnership,
    deleteDataTableOwnership,
    fetchDataTableOwnershipIfNeeded,
} from 'redux/dataSources/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';

import './DataTableHeader.scss';

export interface IDataTableHeader {
    table: IDataTable;
    userInfo: IMyUserInfo;
    tableName: string;
    metastore: IQueryMetastore;
    updateDataTableGolden: (golden: boolean) => any;
}

export const DataTableHeader: React.FunctionComponent<IDataTableHeader> = ({
    table,
    tableName,
    userInfo,
    metastore,

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

    const { username, tableOwnerships = [] } = useShallowSelector(
        (state: IStoreState) => ({
            username: state.user.userInfoById[userInfo.uid].username,
            tableOwnerships:
                state.dataSources.dataTableOwnershipByTableId[table.id],
        })
    );
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
                title={table.golden ? 'Top Tier' : 'Make Top Tier'}
                size="small"
            />
        );
    } else if (table.golden) {
        featuredBadge = <Tag>Top Tier</Tag>;
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
            <AccentText size="text" weight="bold" color="light">
                {tableName}
            </AccentText>
            {iconDOM}
        </div>
    );

    const titleDOM = (
        <AccentText className="mb8" color="text" size="xlarge" weight="bold">
            {shortTableName}
        </AccentText>
    );

    const ownershipDOM = (tableOwnerships || []).map((ownership) => (
        <UserBadge
            key={ownership.uid}
            uid={ownership.uid}
            mini
            cardStyle
            groupPopover
        />
    ));

    const metastoreOwnerDOM = (metastore.owner_types || []).map((ownerType) => {
        const ownerships = tableOwnerships.filter(
            (ownership) => ownership.type === ownerType.name
        );

        if (ownerships.length === 0) {
            return null;
        }

        return (
            <div className="DataTableHeader-owner mb8" key={ownerType.type}>
                <div className="DataTableHeader-owner-list flex-row ">
                    <AccentText
                        className="header-subtitle mr20 mt4"
                        weight="bold"
                        color="lightest"
                        tooltip={ownerType.description}
                        tooltipPos="right"
                    >
                        {ownerType.display_name}
                    </AccentText>
                    <div className="owner-badges mr8 flex-row gap12">
                        {ownerships.map((ownership) => (
                            <UserBadge
                                key={ownership.uid}
                                uid={ownership.uid}
                                mini
                                cardStyle
                                groupPopover
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    });

    // Ownership cannot be removed if owner in db
    const ownerDOM = (
        <div className="DataTableHeader-owner mb8">
            <div className="DataTableHeader-owner-list flex-row ">
                <AccentText
                    className="header-subtitle mr20 mt4"
                    weight="bold"
                    color="lightest"
                >
                    Owners
                </AccentText>
                <div className="owner-badges mr8 flex-row gap12">
                    {dbTableOwner && (
                        <UserBadge name={dbTableOwner} mini cardStyle />
                    )}
                    {ownershipDOM}
                    {isDBTableOwner ? null : isTableOwner ? (
                        <IconButton
                            tooltip={'Remove my table ownership'}
                            tooltipPos="down"
                            icon="UserMinus"
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
                            icon="UserPlus"
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
        <div className="DataTableHeader-tags flex-row">
            <AccentText
                className="header-subtitle mr20"
                weight="bold"
                color="lightest"
            >
                Tags
            </AccentText>
            <DataTableTags
                tableId={table.id}
                readonly={
                    metastore.config[MetadataType.TAG] !==
                    MetadataMode.WRITE_LOCAL
                }
            />
        </div>
    );

    return (
        <div className="DataTableHeader flex-column mb16">
            {topDOM}
            {titleDOM}
            {metastore.config[MetadataType.OWNER] !== MetadataMode.WRITE_LOCAL
                ? metastoreOwnerDOM
                : ownerDOM}
            {tagDOM}
        </div>
    );
};

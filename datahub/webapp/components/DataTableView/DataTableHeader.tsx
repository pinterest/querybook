import React from 'react';
import { last } from 'lodash';

import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'redux/user/types';
import { IDataTable } from 'const/metastore';

import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

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

export const DataTableHeader: React.FunctionComponent<IDataTableHeader> = ({
    table,
    tableName,
    userInfo,

    updateDataTableGolden,
}) => {
    const tableOwner = (table.owner || '').split('@')[0];
    // const isTableOwner = false;

    const shortTableName = Utils.generateNameFromKey(
        last(((table || ({} as any)).name || '').split('.'))
    );

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

    const ownerDOM = tableOwner ? (
        <div className="DataTableHeader-item flex-row">
            <span className="DataTableHeader-key mr8">by</span>
            <UserBadge name={tableOwner} mini />
        </div>
    ) : null;

    // TODO: allow claim ownership - will add back when functionality is there
    // const claimOwnerButton = tableId && isTableOwner && (
    //     <Button
    //         title={isTableOwner ? 'You are the table owner' : 'Edit Owner'}
    //         icon={'edit-2'}
    //         onClick={null}
    //         borderless
    //     />
    // );

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

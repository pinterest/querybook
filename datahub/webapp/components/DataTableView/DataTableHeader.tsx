import { last } from 'lodash';
import React from 'react';

import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'redux/user/types';
import { IDataTable } from 'const/metastore';

import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { Title } from 'ui/Title/Title';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Tag } from 'ui/Tag/Tag';
import { Level } from 'ui/Level/Level';
import { UserBadge } from 'components/UserBadge/UserBadge';

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
        <Level className="mb24">
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

    let goldenBadge;
    if (userInfo.isAdmin) {
        goldenBadge = (
            <div className="flex-row">
                <span className="golden-switch-text">Featured</span>
                <ToggleSwitch
                    checked={table.golden}
                    onChange={updateDataTableGolden}
                />
            </div>
        );
    } else if (table.golden) {
        goldenBadge = <Tag>Golden</Tag>;
    }

    return (
        <div className="DataTableHeader p24">
            <div className="DataTableHeader-top">
                <div className="DataTableHeader-left">
                    {titleDOM}
                    {ownerDOM}
                </div>
                <div className="DataTableHeader-right pt4">
                    {viewsBadgeDOM}
                    {goldenBadge}
                </div>
            </div>
        </div>
    );
};

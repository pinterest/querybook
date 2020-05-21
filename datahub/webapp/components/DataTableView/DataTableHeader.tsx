import { last } from 'lodash';
import React from 'react';

import { generateFormattedDate } from 'lib/utils/datetime';
import * as Utils from 'lib/utils';

import { IMyUserInfo } from 'redux/user/types';
import { IDataTable } from 'const/metastore';

import { ImpressionWidget } from 'components/ImpressionWidget/ImpressionWidget';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { Button } from 'ui/Button/Button';
import { Title } from 'ui/Title/Title';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Tag } from 'ui/Tag/Tag';
import { Level } from 'ui/Level/Level';

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
    const tableId = table.id;

    const tableOwner = (table.owner || '').split('@')[0];
    const isTableOwner = false;

    const shortTableName = Utils.generateNameFromKey(
        last(((table || ({} as any)).name || '').split('.'))
    );

    const dateDOM = table.created_at ? (
        <span>Created at: {generateFormattedDate(table.created_at, 'X')}</span>
    ) : null;
    // TODO: allow claim ownership
    const claimOwnerButton = tableId && isTableOwner && (
        <Button
            title={isTableOwner ? 'You are the table owner' : 'Edit Owner'}
            icon={'edit-2'}
            onClick={null}
            borderless
        />
    );

    // TODO: add views badge && user badge back
    const viewsBadgeDOM = (
        <ImpressionWidget itemId={table.id} type={'DATA_TABLE'} />
    );
    const userBadge = tableOwner;

    const titleDOM = (
        <Level className="mb24">
            <div>
                <Title className="mb8">
                    {shortTableName}
                    <BoardItemAddButton
                        noPadding
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
            {viewsBadgeDOM}
        </Level>
    );

    let goldenBadge;
    if (userInfo.isAdmin) {
        goldenBadge = (
            <div className="flex-row">
                <span className="golden-switch-text">Featured:</span>
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
        <div className="DataTableHeader">
            {titleDOM}
            {dateDOM}
            <div className="horizontal-space-between ">
                <div className="flex-row">
                    {userBadge ? <div>Table Owner: {userBadge}</div> : null}
                    <div>{claimOwnerButton}</div>
                </div>
                <div>
                    <div>{goldenBadge}</div>
                </div>
            </div>
        </div>
    );
};

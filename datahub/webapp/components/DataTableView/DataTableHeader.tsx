import { last } from 'lodash';
import moment from 'moment';
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

    const createdAtDate = moment.utc(table.created_at, 'YYYY-MM-DD').unix();
    const shortTableName = Utils.generateNameFromKey(
        last(((table || ({} as any)).name || '').split('.'))
    );

    const dateDOM = (createdAtDate &&
        generateFormattedDate(createdAtDate, 'X')) || <span className="mh4" />;

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
        <Level>
            <div>
                <Title>
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
            <br />
            <div>{dateDOM}</div>
            <div className="horizontal-space-between ">
                <div className="flex-row">
                    <div>Table Owner: {userBadge}</div>
                    <div>{claimOwnerButton}</div>
                </div>
                <div>
                    <div>{goldenBadge}</div>
                </div>
            </div>
        </div>
    );
};

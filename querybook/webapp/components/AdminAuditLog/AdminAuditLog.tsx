import React from 'react';
import { LogItemType, ActionType } from 'const/adminAuditLog';
import { usePaginatedFetch } from 'hooks/usePaginatedFetch';
import { Table } from 'ui/Table/Table';
import { generateFormattedDate } from 'lib/utils/datetime';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Loading } from 'ui/Loading/Loading';
import { TagGroup, Tag } from 'ui/Tag/Tag';
import { titleize } from 'lib/utils';

export interface IAdminAuditLogProps {
    itemType?: LogItemType;
    itemId?: number;
}

const tableColumns: Array<keyof IAdminAuditLog> = [
    'created_at',
    'uid',
    'item_type',
    'item_id',
    'op',
    'log',
];
const tableColumnWidths = {
    created_at: 130,
    uid: 140,
    item_type: 120,
    item_id: 75,
    op: 70,
};

export interface IAdminAuditLog {
    id: number;

    created_at: number;
    uid: number;

    item_type: LogItemType;
    item_id: number;
    op: ActionType;
    log: string;
}

const PAGE_SIZE = 10;

export const AdminAuditLog: React.FC<IAdminAuditLogProps> = ({
    itemType,
    itemId,
}) => {
    const filters = {};
    if (itemType != null) {
        filters['item_type'] = itemType;
    }
    if (itemId != null) {
        filters['item_id'] = itemId;
    }

    const {
        data,
        isLoading,
        fetchMore,
        hasMore,
    } = usePaginatedFetch<IAdminAuditLog>({
        url: `/admin/audit_log/`,
        batchSize: PAGE_SIZE,
        params: filters,
    });

    const topDOM = filters && (
        <div className="pv4 mvauto">
            {Object.entries(filters).map(([key, value]) => (
                <TagGroup key={key}>
                    <Tag>{titleize(key, '_', ' ')}</Tag>
                    <Tag highlighted>{value}</Tag>
                </TagGroup>
            ))}
        </div>
    );

    const tableDOM = (
        <Table
            rows={data || []}
            cols={tableColumns}
            formatCell={formatCell}
            showAllRows={true}
            colNameToWidths={tableColumnWidths}
        />
    );

    const buttonDOM = hasMore && (
        <div className="center-align mt8">
            <AsyncButton onClick={fetchMore} title="Show more" type="soft" />
        </div>
    );
    return (
        <div className="AdminAuditLog">
            {topDOM}
            {tableDOM}
            {isLoading ? <Loading /> : null}
            {buttonDOM}
        </div>
    );
};

function formatCell(
    index: number,
    column: keyof IAdminAuditLog,
    row: IAdminAuditLog
) {
    switch (column) {
        case 'created_at': {
            const value = row[column];
            return `${generateFormattedDate(value, 'X')}`;
        }
        case 'uid': {
            const value = row[column];
            return <UserBadge uid={value} mini />;
        }
        case 'op': {
            const value = row[column];
            return ActionType[value];
        }
        default:
            return row[column];
    }
}

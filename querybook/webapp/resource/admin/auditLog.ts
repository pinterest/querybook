import { IAdminAuditLog } from 'components/AdminAuditLog/AdminAuditLog';
import { LogItemType } from 'const/adminAuditLog';
import ds from 'lib/datasource';
import { IPaginatedResource } from 'resource/types';

export const AuditLogResource = {
    getPaginatedLogs: (
        itemType: LogItemType,
        itemId: number
    ): IPaginatedResource<IAdminAuditLog> => (limit, offset) => {
        const filters = {
            limit,
            offset,
        };
        if (itemType != null) {
            filters['item_type'] = itemType;
        }
        if (itemId != null) {
            filters['item_id'] = itemId;
        }
        return ds.fetch('/admin/audit_log/', filters);
    },
};

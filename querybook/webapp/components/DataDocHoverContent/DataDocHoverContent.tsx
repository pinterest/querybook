import React from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { generateFormattedDate } from 'lib/utils/datetime';
import { Title } from 'ui/Title/Title';
import { useDataDoc } from 'hooks/redux/useDataDoc';
import { Loader } from 'ui/Loader/Loader';

export const DataDocHoverContent: React.FC<{
    docId: number;
    title: string;
}> = ({ docId, title }) => {
    const { dataDoc, getDataDoc } = useDataDoc(docId);

    const renderDocView = () => {
        const { owner_uid: ownerUid, updated_at: updatedAt } = dataDoc;
        const updatedAtDate = generateFormattedDate(updatedAt);
        return (
            <>
                <UserBadge uid={ownerUid} mini />
                <div className="DataDocHoverContent-date">
                    Last updated: {updatedAtDate}
                </div>
            </>
        );
    };

    return (
        <div className="p8 DataDocHoverContent">
            <div className="mb4">
                <Title size={6}>{title || 'Untitled'}</Title>
            </div>
            <Loader
                item={dataDoc}
                itemKey={docId}
                itemLoader={getDataDoc}
                renderer={renderDocView}
            />
        </div>
    );
};

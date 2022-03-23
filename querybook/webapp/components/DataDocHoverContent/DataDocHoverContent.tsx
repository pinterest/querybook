import React from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { generateFormattedDate } from 'lib/utils/datetime';
import { Title } from 'ui/Title/Title';
import { useDataDoc } from 'hooks/redux/useDataDoc';
import { Loader } from 'ui/Loader/Loader';
import { UntitledText } from 'ui/StyledText/StyledText';

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
                <div className="DataDocHoverContent-date mt4">
                    Updated {updatedAtDate}
                </div>
            </>
        );
    };

    return (
        <div className="DataDocHoverContent">
            <div className="mb8">
                {title ? (
                    <Title size="smedium">{title}</Title>
                ) : (
                    <UntitledText size="smedium" />
                )}
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

import React from 'react';

import { GenericGridItem } from 'components/GenericGridItem/GenericGridItem';
import { IDataDocPreview } from 'redux/search/types';

interface IProps {
    data: IDataDocPreview;
    onClick: (data: IDataDocPreview) => any;
}

export const DataDocGridItem: React.FunctionComponent<IProps> = ({
    data: dataDoc,
    onClick,
}) => {
    return (
        <div className="DataDocGridItem">
            <GenericGridItem
                title={dataDoc.title || 'Untitled'}
                snippet={''.slice(0, 150)}
                date={dataDoc.created_at}
                uid={dataDoc.owner_uid}
                onClick={() => onClick(dataDoc)}
            />
        </div>
    );
};

import React from 'react';

import { IDataDoc } from 'const/datadoc';
import { IconButton } from 'ui/Button/IconButton';
import { DataDocListsModal } from 'components/DataDocListsModal/DataDocListsModal';

interface IProps {
    dataDoc: IDataDoc;
}

export const DataDocListsButton: React.FunctionComponent<IProps> = ({
    dataDoc,
}) => {
    const [showLists, setShowLists] = React.useState(false);

    return (
        <div>
            <IconButton
                icon="List"
                onClick={() => setShowLists(true)}
                tooltip="View Lists"
                tooltipPos="left"
                title="Lists"
            />
            {showLists ? (
                <DataDocListsModal
                    dataDoc={dataDoc}
                    onHide={() => setShowLists(false)}
                />
            ) : null}
        </div>
    );
};

import React from 'react';

import { IDataDoc } from 'const/datadoc';
import { IconButton } from 'ui/Button/IconButton';
import { DataDocBoardsModal } from 'components/DataDocBoardsModal/DataDocBoardsModal';

interface IProps {
    dataDoc: IDataDoc;
}

export const DataDocBoardsButton: React.FunctionComponent<IProps> = ({
    dataDoc,
}) => {
    const [showBoards, setShowBoards] = React.useState(false);

    return (
        <div>
            <IconButton
                icon="List"
                onClick={() => setShowBoards(true)}
                tooltip="View Lists"
                tooltipPos="left"
                title="Lists"
            />
            {showBoards ? (
                <DataDocBoardsModal
                    dataDoc={dataDoc}
                    onHide={() => setShowBoards(false)}
                />
            ) : null}
        </div>
    );
};

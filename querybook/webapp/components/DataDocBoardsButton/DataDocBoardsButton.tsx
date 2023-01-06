import React from 'react';

import { DataDocBoardsModal } from 'components/DataDocBoardsModal/DataDocBoardsModal';
import { ComponentType, ElementType } from 'const/analytics';
import { IDataDoc } from 'const/datadoc';
import { trackClick } from 'lib/analytics';
import { IconButton } from 'ui/Button/IconButton';

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
                onClick={() => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.LISTS_BUTTON,
                    });
                    setShowBoards(true);
                }}
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

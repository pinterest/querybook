import React from 'react';

import history from 'lib/router-history';
import { IDataDoc } from 'const/datadoc';

import { ListLink } from 'ui/Link/ListLink';
import { useDrag } from 'react-dnd';
import { DataDocDraggableType } from './navigatorConst';
import { IconButton } from 'ui/Button/IconButton';

import './DataDocGridItem.scss';

export interface IDataDocGridItemProps {
    dataDoc: IDataDoc;
    className: string;
    pinned?: boolean;
    url?: string;
    onRemove?: (dataDoc: IDataDoc) => any;
}

export const DataDocGridItem: React.FunctionComponent<IDataDocGridItemProps> = ({
    dataDoc,
    className,
    url,
    onRemove,
}) => {
    const [, drag] = useDrag({
        item: {
            type: DataDocDraggableType,
            itemInfo: dataDoc,
        },
    });

    const handleClick = React.useCallback(() => {
        history.push(url);
    }, [url]);

    const { title = '', public: publicDataDoc } = dataDoc;
    const privateIcon = !publicDataDoc && 'lock';

    return (
        <div ref={drag} className="DataDocGridItem">
            <ListLink
                className={className}
                onClick={handleClick}
                to={url}
                icon={privateIcon}
                title={title}
                placeholder="Untitled"
                isRow
            >
                {onRemove && (
                    <IconButton
                        className="delete-grid-item-button"
                        noPadding
                        size={16}
                        icon="x"
                        onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            onRemove(dataDoc);
                        }}
                    />
                )}
            </ListLink>
        </div>
    );
};

import React, { useMemo } from 'react';

import history from 'lib/router-history';
import { IDataDoc } from 'const/datadoc';

import { ListLink } from 'ui/Link/ListLink';
import { useDrag } from 'react-dnd';
import { DataDocDraggableType } from './navigatorConst';
import { IconButton } from 'ui/Button/IconButton';

import './DataDocGridItem.scss';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { Title } from 'ui/Title/Title';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { generateFormattedDate } from 'lib/utils/datetime';

export interface IDataDocGridItemProps {
    dataDoc: IDataDoc;
    className: string;
    pinned?: boolean;
    url?: string;
    onRemove?: (dataDoc: IDataDoc) => any;
}

export const DataDocGridItem: React.FunctionComponent<IDataDocGridItemProps> = React.memo(
    ({ dataDoc, className, url, onRemove }) => {
        const [, drag] = useDrag({
            item: {
                type: DataDocDraggableType,
                itemInfo: dataDoc,
            },
        });

        const handleClick = React.useCallback(() => {
            history.push(url);
        }, [url]);

        const handleRemoveDataDoc = React.useCallback(
            (event: React.MouseEvent) => {
                if (onRemove) {
                    event.stopPropagation();
                    event.preventDefault();
                    onRemove(dataDoc);
                }
            },
            [onRemove, dataDoc]
        );

        const { title = '', public: publicDataDoc } = dataDoc;
        const privateIcon = !publicDataDoc && 'lock';

        return (
            <div ref={drag} className="DataDocGridItem">
                <PopoverHoverWrapper>
                    {(showPopover, anchorElement) => (
                        <>
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
                                        onClick={handleRemoveDataDoc}
                                    />
                                )}
                            </ListLink>
                            {showPopover && anchorElement && (
                                <Popover
                                    onHide={() => {
                                        /* ignore */
                                    }}
                                    anchor={anchorElement}
                                >
                                    <DataDocHoverContent dataDoc={dataDoc} />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            </div>
        );
    }
);

const DataDocHoverContent: React.FC<{
    dataDoc: IDataDoc;
}> = ({ dataDoc }) => {
    const { title, owner_uid: ownerUid, updated_at: updatedAt } = dataDoc;
    const updatedAtDate = useMemo(() => generateFormattedDate(updatedAt), [
        updatedAt,
    ]);
    return (
        <div className="p8 DataDocHoverContent">
            <div className="mb4">
                <Title size={6}>{title || 'Untitled'}</Title>
            </div>
            <UserBadge uid={ownerUid} mini />
            <div className="DataDocHoverContent-date">
                Last updated: {updatedAtDate}
            </div>
        </div>
    );
};

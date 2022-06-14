import React from 'react';
import { useDrag } from 'react-dnd';

import { IDataDoc } from 'const/datadoc';
import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';

import history from 'lib/router-history';
import NOOP from 'lib/utils/noop';

import { ListLink } from 'ui/Link/ListLink';
import { IconButton } from 'ui/Button/IconButton';

import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { DataDocDraggableType } from './navigatorConst';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import './DataDocGridItem.scss';

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
            type: DataDocDraggableType,
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
        const privateIcon = !publicDataDoc ? 'Lock' : null;

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
                                isRow
                            >
                                {onRemove && (
                                    <IconButton
                                        className="delete-grid-item-button ml8"
                                        noPadding
                                        size={16}
                                        icon="X"
                                        onClick={handleRemoveDataDoc}
                                    />
                                )}
                            </ListLink>
                            <UrlContextMenu
                                url={url}
                                anchorRef={{ current: anchorElement }}
                            />
                            {showPopover && anchorElement && (
                                <Popover
                                    onHide={NOOP}
                                    anchor={anchorElement}
                                    layout={['right', 'top']}
                                >
                                    <DataDocHoverContent
                                        docId={dataDoc.id}
                                        title={title}
                                    />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            </div>
        );
    }
);

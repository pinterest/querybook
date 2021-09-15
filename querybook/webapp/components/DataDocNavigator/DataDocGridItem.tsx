import React from 'react';

import history from 'lib/router-history';
import { IDataDoc } from 'const/datadoc';

import { ListLink } from 'ui/Link/ListLink';
import { useDrag } from 'react-dnd';
import { DataDocDraggableType } from './navigatorConst';
import { IconButton } from 'ui/Button/IconButton';

import './DataDocGridItem.scss';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';

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

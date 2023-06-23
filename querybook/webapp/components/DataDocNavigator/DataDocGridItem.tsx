import moment from 'moment';
import React from 'react';
import { useDrag } from 'react-dnd';

import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';
import { IDataDoc } from 'const/datadoc';
import { fromNow } from 'lib/utils/datetime';
import NOOP from 'lib/utils/noop';
import { IconButton } from 'ui/Button/IconButton';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { ListLink } from 'ui/Link/ListLink';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { StyledText } from 'ui/StyledText/StyledText';

import { DataDocDraggableType } from './navigatorConst';

import './DataDocGridItem.scss';

export interface IDataDocGridItemProps {
    dataDoc: IDataDoc;
    className: string;
    pinned?: boolean;
    url?: string;
    onRemove?: (dataDoc: IDataDoc) => any;
}

const ONE_WEEK_EPOCH = 604800;

export const DataDocGridItem: React.FunctionComponent<IDataDocGridItemProps> =
    React.memo(({ dataDoc, className, url, onRemove }) => {
        const [, drag] = useDrag({
            type: DataDocDraggableType,
            item: {
                type: DataDocDraggableType,
                itemInfo: dataDoc,
            },
        });

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

        const getLastUpdatedDOM = (updatedAt: number) => {
            const todayEpoch = new Date().getTime() / 1000;

            const isMoreThanAWeekAgo = todayEpoch - updatedAt > ONE_WEEK_EPOCH;
            return isMoreThanAWeekAgo
                ? moment(updatedAt, 'X').format('YYYY-MM-DD')
                : fromNow(updatedAt, 'X');
        };

        return (
            <div ref={drag} className="DataDocGridItem">
                <PopoverHoverWrapper>
                    {(showPopover, anchorElement) => (
                        <>
                            <ListLink
                                className={className}
                                to={url}
                                icon={privateIcon}
                                title={title}
                                isRow
                            >
                                {title ? null : (
                                    <StyledText
                                        color="lightest-0"
                                        weight="light"
                                    >
                                        {getLastUpdatedDOM(dataDoc.updated_at)}
                                    </StyledText>
                                )}
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
    });

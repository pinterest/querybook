import clsx from 'clsx';
import React from 'react';

import { BoardHoverContent } from 'components/BoardHoverContent/BoardHoverContent';
import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';
import { DataTableHoverContent } from 'components/DataTableNavigator/DataTableHoverContent';
import { QueryExecutionHoverContent } from 'components/QueryExecutionHoverContent/QueryExecutionHoverContent';
import { BoardItemType } from 'const/board';
import history from 'lib/router-history';
import NOOP from 'lib/utils/noop';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { IconButton } from 'ui/Button/IconButton';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { Icon } from 'ui/Icon/Icon';
import { Level } from 'ui/Level/Level';
import { ListLink } from 'ui/Link/ListLink';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { UntitledText } from 'ui/StyledText/StyledText';

import { IProcessedBoardItem } from '../DataDocNavigator/navigatorConst';

import './BoardListItemRow.scss';

export const BoardListItemRow: React.FC<{
    item: IProcessedBoardItem;
    onDeleteBoardItem: (itemId: number, itemType: BoardItemType) => void;
}> = ({ item, onDeleteBoardItem }) => {
    const { key, itemType, icon, title, itemUrl, selected, itemId } = item;
    const itemUrlWithinEnv = getWithinEnvUrl(itemUrl);

    const handleClick = React.useCallback(() => {
        history.push(itemUrlWithinEnv);
    }, [itemUrlWithinEnv]);

    return (
        <PopoverHoverWrapper>
            {(showPopover, anchorElement) => (
                <>
                    <Level key={key} className="BoardListItemRow">
                        <ListLink
                            className={clsx({
                                'flex1 pr8': true,
                                selected,
                            })}
                            onClick={handleClick}
                            to={
                                itemType === 'table'
                                    ? {
                                          pathname: itemUrlWithinEnv,
                                          state: {
                                              isModal: true,
                                          },
                                      }
                                    : itemUrlWithinEnv
                            }
                            isRow
                            noPlaceHolder
                        >
                            <Icon className="mr4" size={16} name={icon} />
                            {title ? (
                                <span className="ListLinkText">{title}</span>
                            ) : (
                                <UntitledText className="ListLinkPlaceholder" />
                            )}
                            <IconButton
                                className="delete-board-item-button"
                                noPadding
                                size={16}
                                icon="X"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    onDeleteBoardItem(itemId, itemType);
                                }}
                            />
                        </ListLink>
                    </Level>
                    <UrlContextMenu
                        url={itemUrlWithinEnv}
                        anchorRef={{ current: anchorElement }}
                    />
                    {showPopover && anchorElement && (
                        <Popover
                            onHide={NOOP}
                            layout={['right', 'top']}
                            anchor={anchorElement}
                        >
                            {itemType === 'data_doc' ? (
                                <DataDocHoverContent
                                    docId={itemId}
                                    title={title}
                                />
                            ) : itemType === 'table' ? (
                                <DataTableHoverContent
                                    tableId={itemId}
                                    tableName={title}
                                />
                            ) : itemType === 'board' ? (
                                <BoardHoverContent
                                    boardId={itemId}
                                    title={title}
                                />
                            ) : (
                                <QueryExecutionHoverContent
                                    queryExecutionId={itemId}
                                    title={title}
                                />
                            )}
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    );
};

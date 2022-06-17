import clsx from 'clsx';
import React from 'react';

import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';
import { DataTableHoverContent } from 'components/DataTableNavigator/DataTableHoverContent';
import { BoardItemType } from 'const/board';
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

import { IProcessedBoardItem } from './navigatorConst';

import './DataDocNavigatorBoardItem.scss';

export const BoardListItemRow: React.FC<{
    item: IProcessedBoardItem;
    onDeleteBoardItem: (itemId: number, itemType: BoardItemType) => void;
}> = ({ item, onDeleteBoardItem }) => {
    const { key, itemType, icon, title, itemUrl, selected, itemId } = item;
    const itemUrlWithinEnv = getWithinEnvUrl(itemUrl);
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
                            to={{
                                pathname: itemUrlWithinEnv,
                                state: {
                                    isModal: itemType !== 'data_doc',
                                },
                            }}
                            isRow
                            noPlaceHolder
                        >
                            <Icon size={16} name={icon} />
                            {title.length ? (
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
                            ) : (
                                <DataTableHoverContent
                                    tableId={itemId}
                                    tableName={title}
                                />
                            )}
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    );
};

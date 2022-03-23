import clsx from 'clsx';
import React from 'react';

import { BoardItemType } from 'const/board';
import { DataDocHoverContent } from 'components/DataDocHoverContent/DataDocHoverContent';
import { DataTableHoverContent } from 'components/DataTableNavigator/DataTableHoverContent';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import NOOP from 'lib/utils/noop';
import { Level } from 'ui/Level/Level';
import { ListLink } from 'ui/Link/ListLink';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { Popover } from 'ui/Popover/Popover';
import { IProcessedBoardItem } from './navigatorConst';
import './DataDocNavigatorBoardItem.scss';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { UntitledText } from 'ui/StyledText/StyledText';

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

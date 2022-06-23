import * as React from 'react';
import clsx from 'clsx';
import { useDrag } from 'react-dnd';

import history from 'lib/router-history';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { IBoardWithItemIds } from 'const/board';

import { BoardDraggableType } from 'components/DataDocNavigator/navigatorConst';

import { IconButton } from 'ui/Button/IconButton';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { ListLink } from 'ui/Link/ListLink';
import { Title } from 'ui/Title/Title';

interface IProps {
    boardId: number;
    boardName: string;
    collapsed: boolean;
    toggleCollapsed: () => void;
    boardData?: IBoardWithItemIds;
    onEdit?: () => void;
    isEditable?: boolean;
}

export const BoardExpandableHeader: React.FunctionComponent<IProps> = ({
    boardId,
    boardName,
    boardData,
    collapsed,
    onEdit,
    isEditable = true,
    toggleCollapsed,
}) => {
    const selfRef = React.useRef<HTMLDivElement>();

    const boardUrl = React.useMemo(
        () => getWithinEnvUrl(`/list/${boardId}/`),
        [boardId]
    );
    const handleClick = React.useCallback(() => {
        history.push(boardUrl);
    }, [boardUrl]);

    const [, drag] = useDrag({
        type: BoardDraggableType,
        item: {
            type: BoardDraggableType,
            itemInfo: boardData,
        },
    });

    return (
        <div
            className={clsx(
                'horizontal-space-between',
                'board-header-section',
                'pl8',
                !collapsed && 'active'
            )}
            ref={drag}
        >
            <div className="flex-row" ref={selfRef}>
                <ListLink
                    className="board-header-title flex1"
                    onClick={handleClick}
                    to={boardUrl}
                    noPlaceHolder
                    isRow
                >
                    <Title
                        size="small"
                        color="light"
                        className="one-line-ellipsis"
                    >
                        {boardName}
                    </Title>
                </ListLink>
                <UrlContextMenu url={boardUrl} anchorRef={selfRef} />
            </div>
            <div className="header-control-section">
                {isEditable && (
                    <span className="hover-control-section">
                        <IconButton
                            size={18}
                            icon="Edit3"
                            onClick={onEdit}
                            noPadding
                        />
                    </span>
                )}
                <IconButton
                    icon={collapsed ? 'ChevronRight' : 'ChevronDown'}
                    onClick={toggleCollapsed}
                />
            </div>
        </div>
    );
};

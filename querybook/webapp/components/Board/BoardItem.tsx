import * as React from 'react';
import { Link } from 'react-router-dom';

import { BoardItemType } from 'const/board';
import { getWithinEnvUrl } from 'lib/utils/query-string';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Title } from 'ui/Title/Title';

import './BoardItem.scss';
import { titleize } from 'lib/utils';

export interface IBoardItemProps {
    itemId: number;
    itemType: BoardItemType;
    title: string;
    titleUrl: string;
    notesDOM: React.ReactElement;
    isCollapsed: boolean;
    isEditMode: boolean;
}

const boardItemTypeToIcon: Record<BoardItemType, AllLucideIconNames> = {
    table: 'Book',
    data_doc: 'File',
    board: 'Briefcase',
};

export const BoardItem: React.FunctionComponent<IBoardItemProps> = ({
    itemId,
    itemType,
    title,
    titleUrl,
    notesDOM,
    isCollapsed,
    isEditMode,
}) => {
    const [collapsed, setCollapsed] = React.useState(isCollapsed);

    React.useEffect(() => setCollapsed(isCollapsed), [isCollapsed]);

    return (
        <div className="BoardItem mt8 mb16 p12">
            <div className="BoardItem-top horizontal-space-between">
                <div className="flex-row">
                    <Icon
                        name={boardItemTypeToIcon[itemType]}
                        size={20}
                        className="mr8"
                        color="light"
                    />
                    <Link to={getWithinEnvUrl(titleUrl)}>
                        <Title
                            size="smedium"
                            tooltip={`Go to ${titleize(itemType, '_', ' ')}`}
                            tooltipPos="right"
                        >
                            {title}
                        </Title>
                    </Link>
                </div>
                <div className="BoardItem-controls flex-center">
                    {isEditMode ? (
                        <>
                            <IconButton size={18} icon="X" noPadding />
                            <IconButton
                                size={18}
                                icon="MoveVertical"
                                noPadding
                            />
                        </>
                    ) : (
                        <>
                            <BoardItemAddButton
                                size={18}
                                itemType={itemType}
                                itemId={itemId}
                                noPadding
                                popoverLayout={['left', 'top']}
                                tooltipPos="left"
                                tooltip="Add to another list"
                            />
                            <IconButton
                                size={18}
                                icon={collapsed ? 'Maximize2' : 'Minimize2'}
                                onClick={() => setCollapsed((c) => !c)}
                                noPadding
                            />
                        </>
                    )}
                </div>
            </div>
            {collapsed || isEditMode ? null : notesDOM}
        </div>
    );
};

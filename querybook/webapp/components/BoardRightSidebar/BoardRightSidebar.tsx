import * as React from 'react';

import { useAnnouncements } from 'hooks/redux/useAnnouncements';
import { useScrollToTop } from 'hooks/ui/useScrollToTop';
import { IconButton } from 'ui/Button/IconButton';

import './BoardRightSidebar.scss';

interface IProps {
    onCollapse: () => any;
    defaultCollapse: boolean;
    onEditModeToggle: () => any;
    isEditMode: boolean;
    isEditable: boolean;
}

export const BoardRightSidebar: React.FunctionComponent<IProps> = ({
    onCollapse,
    defaultCollapse,
    onEditModeToggle,
    isEditMode,
    isEditable,
}) => {
    const numAnnouncements = useAnnouncements().length;
    const selfRef = React.useRef<HTMLDivElement>();
    const { showScrollToTop, scrollToTop } = useScrollToTop({
        containerRef: selfRef,
    });

    const buttonSection = (
        <div className="flex-column">
            <IconButton
                icon="ArrowUp"
                className={showScrollToTop ? '' : 'hide-button'}
                onClick={scrollToTop}
            />
            <IconButton
                icon={defaultCollapse ? 'Maximize2' : 'Minimize2'}
                tooltip={
                    defaultCollapse
                        ? 'Uncollapse query cells'
                        : 'Collapse query cells'
                }
                tooltipPos="left"
                onClick={onCollapse}
                disabled={isEditMode}
            />
            <IconButton
                icon={isEditMode ? 'Check' : 'Edit2'}
                tooltip={
                    isEditable
                        ? isEditMode
                            ? 'Done Editing'
                            : 'Edit Mode: reorder & delete items'
                        : 'Must be an editor to reoder & delete'
                }
                tooltipPos="left"
                onClick={onEditModeToggle}
                disabled={!isEditable}
            />
        </div>
    );

    return (
        <div
            className="BoardRightSidebar right-align"
            style={{ height: `calc(100vh - ${numAnnouncements * 40}px)` }}
            ref={selfRef}
        >
            {buttonSection}
        </div>
    );
};

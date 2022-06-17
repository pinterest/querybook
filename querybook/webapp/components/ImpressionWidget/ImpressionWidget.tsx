import React, { useCallback, useRef, useState } from 'react';

import { ImpressionType } from 'const/impression';
import { useResource } from 'hooks/useResource';
import { ImpressionResource } from 'resource/impression';
import { Icon } from 'ui/Icon/Icon';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';

import { ImpressionWidgetMenu } from './ImpressionWidgetMenu';

import './ImpressionWidget.scss';

interface IProps {
    type: ImpressionType;
    itemId: number;
    popoverLayout?: PopoverLayout;
}

export const ImpressionWidget: React.FunctionComponent<IProps> = ({
    type,
    itemId,
    popoverLayout = ['left', 'top'],
}) => {
    const selfRef = useRef<HTMLSpanElement>(null);
    const [showMenu, setShowMenu] = useState(false);

    const { data: totalViews, isLoading } = useResource(
        React.useCallback(
            () => ImpressionResource.getUserCount(type, itemId),
            [type, itemId]
        )
    );

    const onHidePopover = useCallback(() => setShowMenu(false), []);
    const widgetMenu = showMenu && (
        <Popover
            onHide={onHidePopover}
            anchor={selfRef.current}
            layout={popoverLayout}
        >
            <ImpressionWidgetMenu type={type} itemId={itemId} />
        </Popover>
    );

    const icon = (
        <Icon name={isLoading ? 'Loading' : 'Eye'} size={14} className="mr8" />
    );
    return (
        <>
            <span
                className="ImpressionWidget"
                onClick={() => setShowMenu(true)}
                ref={selfRef}
            >
                {icon}
                {isLoading ? ' ' : <PrettyNumber val={totalViews} />}
            </span>
            {widgetMenu}
        </>
    );
};

import React, { useState, useRef, useCallback } from 'react';
import { ImpressionType } from 'const/impression';
import { useDataFetch } from 'hooks/useDataFetch';
import { Icon } from 'ui/Icon/Icon';

import { ImpressionWidgetMenu } from './ImpressionWidgetMenu';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';

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

    const { data: totalViews, isLoading } = useDataFetch<number>({
        url: `/impression/${type}/${itemId}/count/`,
    });

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
        <Icon name={isLoading ? 'loader' : 'eye'} size={14} className="mr8" />
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

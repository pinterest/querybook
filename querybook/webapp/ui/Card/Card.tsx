import clsx from 'clsx';
import * as React from 'react';

import { AccentText } from 'ui/StyledText/StyledText';

import './Card.scss';

interface IProps {
    title?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => any;

    height?: string;
    width?: string;
    flexRow?: boolean;
    alignLeft?: boolean;
    className?: string;
}

export const Card: React.FunctionComponent<IProps> = ({
    title,
    children,
    onClick,

    height,
    width,
    flexRow,
    alignLeft,
    className = '',
}) => {
    const cardClassName = clsx({
        Card: true,
        'flex-row': flexRow,
        'flex-column': !flexRow && !alignLeft,
        'align-left': alignLeft,
        clickable: onClick,
        [className]: true,
    });
    return (
        <div
            className={cardClassName}
            onClick={onClick}
            style={height || width ? { height, width } : null}
        >
            {title && (
                <AccentText className="mt8 mb16" size="large" weight="bold">
                    {title}
                </AccentText>
            )}
            <div className="Card-content">{children}</div>
        </div>
    );
};

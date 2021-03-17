import * as React from 'react';
import clsx from 'clsx';

import './Card.scss';

interface IProps {
    title?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => any;

    height?: string;
    width?: string;
    flexRow?: boolean;
    alignLeft?: boolean;
}

export const Card: React.FunctionComponent<IProps> = ({
    title,
    children,
    onClick,

    height,
    width,
    flexRow,
    alignLeft,
}) => {
    const cardClassName = clsx({
        Card: true,
        'flex-row': flexRow,
        'flex-column': !flexRow && !alignLeft,
        'align-left': alignLeft,
        clickable: onClick,
    });
    return (
        <div
            className={cardClassName}
            onClick={onClick}
            style={height || width ? { height, width } : null}
        >
            {title && <div className="Card-title">{title}</div>}
            <div className="Card-content">{children}</div>
        </div>
    );
};

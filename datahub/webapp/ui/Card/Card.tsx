import * as React from 'react';

import './Card.scss';

interface IProps {
    title: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => any;

    height?: string;
    width?: string;
    flexRow?: boolean;
}

export const Card: React.FunctionComponent<IProps> = ({
    title,
    children,
    onClick,

    height,
    width,
    flexRow,
}) => {
    return (
        <div
            className={flexRow ? 'Card flex-row' : 'Card flex-column'}
            onClick={onClick}
            style={height || width ? { height, width } : null}
        >
            {title && <div className="Card-title">{title}</div>}
            <div className="Card-content">{children}</div>
        </div>
    );
};

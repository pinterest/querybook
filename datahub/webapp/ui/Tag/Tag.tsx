import React from 'react';

import './Tag.scss';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;
    highlighted?: boolean;
}

export const TagGroup: React.FunctionComponent<ITagGroupProps> = ({
    className,
    children,
}) => {
    return <div className={`${className} TagGroup`}>{children}</div>;
};

export const Tag: React.FunctionComponent<ITagProps> = ({
    children,
    highlighted = false,
}) => {
    return (
        <span className={highlighted ? 'Tag highlighted' : 'Tag'}>
            {children}
        </span>
    );
};

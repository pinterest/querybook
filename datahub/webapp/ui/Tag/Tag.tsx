import React from 'react';
import './Tag.scss';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;
    className?: string;
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
    className,
    highlighted = false,
}) => {
    return (
        <span
            className={
                highlighted
                    ? `${className} Tag highlighted`
                    : `${className} Tag`
            }
        >
            {children}
        </span>
    );
};

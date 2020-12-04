import React from 'react';
import clsx from 'clsx';
import './GradientText.scss';

export default ({
    className,

    text,
}) => {
    return (
        <span className={clsx('GradientText ', className)}>
            <span className="gradient-content">{text}</span>
        </span>
    );
};

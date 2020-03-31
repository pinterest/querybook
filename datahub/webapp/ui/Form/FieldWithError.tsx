import React from 'react';

interface IProps {
    error: string;
}
export const FieldWithError: React.FunctionComponent<IProps> = ({
    error,
    children,
}) => {
    const divProps = {};
    if (error && error.length) {
        divProps['aria-label'] = error;
        divProps['data-balloon-pos'] = 'up';
        divProps['data-balloon-visible'] = true;
    }

    return <div {...divProps}>{children}</div>;
};

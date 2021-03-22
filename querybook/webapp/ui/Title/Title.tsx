import React from 'react';
import clsx from 'clsx';
import styled from 'styled-components';
import { numFontSizeToString } from 'const/font';

interface IStyledTitleProps {
    inline?: boolean;
    gap?: boolean;

    size: string;
    weight: string;
    color: string;
}
const StyledTitle = styled.p<IStyledTitleProps>`
    ${(props) => (props.inline ? 'display: inline;' : '')};
    ${(props) => (props.gap ? 'margin-bottom: 1.5rem;' : '')};

    color: ${(props) => props.color || 'var(--text-color)'};
    font-weight: ${(props) => props.weight || 'inherit'};
    font-size: ${(props) => props.size || 'var(--large-text-size)'};

    & + .Subtitle:not(:empty) {
        margin-top: ${(props) =>
            `calc(${props.size || 'var(--large-text-size)'} * -0.4)`};
    }
`;

export interface ITitleProps extends React.HTMLProps<HTMLParagraphElement> {
    tooltip?: string;

    // styling
    className?: string;
    size?: number;
    subtitle?: boolean;
    gap?: boolean;

    color?: string;
    weight?: string;

    inline?: boolean;
}

const defaultProps: ITitleProps = {
    className: '',
    size: 3,
    subtitle: false,
    gap: false,
};

export const Title: React.FunctionComponent<ITitleProps> = ({
    className,
    size,
    subtitle,
    children,
    color,
    weight,
    tooltip,
    ...elementProps
}) => {
    const titleClassName = clsx({
        Title: true,
        Subtitle: subtitle,
        [className]: Boolean(className),
    });

    if (tooltip) {
        elementProps['aria-label'] = tooltip;
        elementProps['data-balloon-pos'] = 'up';
    }

    const fontWeight = weight ?? (subtitle ? '400' : '600');
    const fontSize = numFontSizeToString[size];
    const fontColor =
        color != null
            ? color
            : subtitle
            ? 'var(--dark-text-color)'
            : 'var(--text-color)';
    return (
        <StyledTitle
            color={fontColor}
            className={titleClassName}
            weight={fontWeight}
            size={fontSize}
            {...elementProps}
        >
            {children}
        </StyledTitle>
    );
};

Title.defaultProps = defaultProps;

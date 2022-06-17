import clsx from 'clsx';
import React from 'react';
import styled from 'styled-components';

import { ColorPalette } from 'const/chartColors';
import { TooltipDirection } from 'const/tooltip';

import './Tag.scss';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;

    highlighted?: boolean;
    mini?: boolean;
    light?: boolean;
    withBorder?: boolean;
    color?: string;

    tooltip?: React.ReactNode;
    tooltipPos?: TooltipDirection;

    onClick?: () => any;

    className?: string;
}

export const TagGroup: React.FunctionComponent<ITagGroupProps> = ({
    className,
    children,
}) => <div className={`${className} TagGroup`}>{children}</div>;

const StyledColorTag = styled.span.attrs<{
    highlighted?: boolean;
    light?: boolean;
    /**
     * Must be one of ColorPalette name
     */
    color?: string;
    withBorder?: boolean;
}>({
    className: 'Tag',
})`
    ${(props) => {
        let bgColor = 'var(--bg-light)';
        let textColor = 'var(--text-light)';
        if (props.color) {
            const color = ColorPalette.find((c) => c.name === props.color);
            if (color) {
                bgColor = color.fillColor;
                textColor = color.color;
            }
        } else if (props.highlighted) {
            bgColor = 'var(--color-accent-lightest-0)';
            textColor = 'var(--color-accent-dark)';
        } else if (props.light) {
            bgColor = 'var(--bg-lightest)';
        }

        const borderColor = props.withBorder ? textColor : 'transparent';

        return `
            background-color: ${bgColor};
            color: ${textColor};
            border: 1px solid ${borderColor};
        `;
    }}
`;

export const Tag = React.forwardRef<HTMLSpanElement, ITagProps>(
    (
        {
            children,
            highlighted = false,
            tooltip,
            tooltipPos = 'top',
            onClick,
            className,
            mini,
            light,
            color,
            withBorder,
        },
        ref
    ) => {
        const tooltipProps = {};
        if (tooltip) {
            tooltipProps['aria-label'] = tooltip;
            tooltipProps['data-balloon-pos'] = tooltipPos;
        }

        const tagClassname = clsx({
            Tag: true,
            'flex-row': true,
            mini,
            [className]: Boolean(className),
        });

        return (
            <StyledColorTag
                {...tooltipProps}
                onClick={onClick}
                className={tagClassname}
                highlighted={highlighted}
                light={light}
                color={color}
                withBorder={withBorder}
                ref={ref}
            >
                {children}
            </StyledColorTag>
        );
    }
);

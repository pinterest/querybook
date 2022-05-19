import React from 'react';
import clsx from 'clsx';

import { TooltipDirection } from 'const/tooltip';

import './Tag.scss';
import styled from 'styled-components';
import { ColorPalette } from 'const/chartColors';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;

    highlighted?: boolean;
    mini?: boolean;
    light?: boolean;
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
     * Must be one of ColorPalette
     */
    color?: string;
}>({
    className: 'Tag',
})`
    background-color: var(--bg-light);
    color: var(--text-light);

    ${(props) =>
        props.highlighted &&
        `
    background-color: var(--color-accent-lightest-0);
    color: var(--color-accent-dark);
    `}

    ${(props) =>
        props.light &&
        `
    background-color: var(--bg-lightest);
    `}

    ${(props) => {
        if (!props.color) {
            return '';
        }
        const color = ColorPalette.find((c) => c.name === props.color);
        if (!color) {
            return '';
        }

        return `
            background-color: ${color.fillColor};
            color: ${color.color}
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
                ref={ref}
            >
                {children}
            </StyledColorTag>
        );
    }
);

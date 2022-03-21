import clsx from 'clsx';
import * as React from 'react';
import styled from 'styled-components';

interface IStyledTextProps {
    weight?: 'normal' | 'light' | 'bold' | 'extra';
    size?:
        | 'xxxsmall'
        | 'xxsmall'
        | 'xsmall'
        | 'small'
        | 'text'
        | 'text-0'
        | 'med'
        | 'large'
        | 'xlarge'
        | 'xxlarge'
        | 'xxxlarge';
    color?:
        | 'lightest-0'
        | 'lightest'
        | 'light'
        | 'text'
        | 'dark'
        | 'invert'
        | 'accent'
        | 'accent-dark';
    cursor?: 'default' | 'pointer' | 'not-allowed';

    accentFont?: boolean;
    noUserSelect?: boolean;
    hover?: boolean;

    untitled?: boolean;
    center?: boolean;
}

interface IProps extends IStyledTextProps {
    className?: string;

    tooltip?: string;
    tooltipPos?: 'up' | 'left' | 'right' | 'down';
}

const StyledTextDiv = styled.div`
    ${(props) =>
        props.weight
            ? ` font-weight: ${
                  props.weight === 'bold'
                      ? 'var(--bold-font)'
                      : `var(--${props.weight}-bold-font)`
              }`
            : ''};
    ${(props) =>
        props.size
            ? ` font-size: ${
                  props.size === 'text'
                      ? 'var(--text-size)'
                      : `var(--${props.size}-text-size)`
              }`
            : ''};
    ${(props) =>
        props.color
            ? ` color: ${
                  props.color === 'text'
                      ? 'var(--text)'
                      : props.color.startsWith('accent')
                      ? `var(--color-${props.color})`
                      : `var(--text-${props.color})`
              }`
            : ''};
    ${(props) =>
        props.accentFont
            ? `
                font-family: var(--font-accent);
                letter-spacing: var(--letter-spacing${
                    props.weight === 'bold' || props.weight === 'extra'
                        ? '-bold'
                        : ''
                })
                `
            : ''};

    ${(props) => (props.noUserSelect ? `user-select: none;` : '')};
    ${(props) =>
        props.cursor
            ? ` cursor: ${props.cursor ? props.cursor : 'inherit'}`
            : ''};
    ${(props) =>
        props.hover
            ? `
                &:hover {
                    color: var(--text-hover);
                }`
            : ''};
    ${(props) =>
        props.untitled
            ? `
                opacity: 0.7;
                font-style: italic;`
            : ''};
    ${(props) =>
        props.center
            ? `
                display: flex;
                justify-content: center;`
            : ''};

    * {
        ${(props) =>
            props.weight
                ? ` font-weight: ${
                      props.weight === 'bold'
                          ? 'var(--bold-font)'
                          : `var(--${props.weight}-bold-font)`
                  }`
                : ''};
        ${(props) =>
            props.size
                ? ` font-size: ${
                      props.size === 'text'
                          ? 'var(--text-size)'
                          : `var(--${props.size}-text-size)`
                  }`
                : ''};
        ${(props) =>
            props.color
                ? ` color: ${
                      props.color === 'text'
                          ? 'var(--text)'
                          : props.color.startsWith('accent')
                          ? `var(--color-${props.color})`
                          : `var(--text-${props.color})`
                  }`
                : ''};
        ${(props) =>
            props.accentFont
                ? `
                        font-family: var(--font-accent);
                        letter-spacing: var(--letter-spacing${
                            props.weight === 'bold' || props.weight === 'extra'
                                ? '-bold'
                                : ''
                        })
                        `
                : ''};
        ${(props) =>
            props.hover
                ? `
                    &:hover {
                        color: var(--text-hover);
                    }`
                : ''};
    }
`;

export const StyledText: React.FunctionComponent<IProps> = ({
    children,
    className,
    tooltip,
    tooltipPos = 'up',
    accentFont,
    noUserSelect,
    ...elementProps
}) => {
    const textClassName = clsx({
        Text: true,
        [className]: Boolean(className),
    });

    if (tooltip) {
        elementProps['aria-label'] = tooltip;
        elementProps['data-balloon-pos'] = tooltipPos;
    }

    elementProps['accentFont'] = Boolean(accentFont);
    elementProps['noUserSelect'] = Boolean(noUserSelect);

    return (
        <StyledTextDiv {...elementProps} className={textClassName}>
            {children}
        </StyledTextDiv>
    );
};

export const AccentText: React.FunctionComponent<IProps> = ({
    children,
    ...elementProps
}) => (
    <StyledText accentFont {...elementProps}>
        {children}
    </StyledText>
);

export const UntitledText: React.FunctionComponent<IProps> = ({
    ...elementProps
}) => (
    <StyledText untitled {...elementProps}>
        Untitled
    </StyledText>
);

export const EmptyText: React.FunctionComponent<IProps> = ({
    children,
    className,
    ...elementProps
}) => (
    <AccentText
        className={'Empty Text ' + className}
        color="lightest-0"
        weight="bold"
        size="large"
        center
        {...elementProps}
    >
        {children}
    </AccentText>
);

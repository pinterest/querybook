import styled from 'styled-components';

export interface ISharedButtonProps {
    pushable?: boolean;
    attached?: 'right' | 'left' | null;
    size?: 'small' | 'medium';

    disabled?: boolean;

    fullWidth?: boolean;
    uppercase?: boolean;

    fontWeight?: string;
}
export interface IStyledButtonThemeProps {
    color?: string;
    bgColor?: string;
    borderColor?: string;
    hoverColor?: string;
    hoverBgColor?: string;
    hoverBorderColor?: string;
}

type StyledButtonProps = ISharedButtonProps & IStyledButtonThemeProps;

export const StyledButton = styled.span<StyledButtonProps>`
    display: inline-flex;
    align-items: center;

    border-radius: var(--border-radius-sm);

    color: ${(props) => props.color || 'inherit'};
    background-color: ${(props) => props.bgColor || 'inherit'};

    + .Button {
        margin-left: 12px;
    }

    &:hover,
    &.active {
        ${(props) => {
            if (props.disabled) {
                return '';
            }
            let hoverCSS = '';
            if (props.hoverBgColor) {
                hoverCSS += `background-color: ${props.hoverBgColor};`;
            }
            if (props.hoverColor) {
                hoverCSS += `color: ${props.hoverColor};`;
            }
            if (props.hoverBorderColor) {
                hoverCSS += `border-color: ${props.hoverBorderColor}`;
            }

            return hoverCSS;
        }}
    }

    ${(props) => (props.fontWeight ? `font-weight: ${props.fontWeight}` : '')};

    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    * {
        cursor: ${(props) =>
            props.disabled ? 'not-allowed' : 'pointer'} !important;
    }
    padding: ${(props) => (props.size === 'small' ? '2px 6px' : '4px 12px')};

    white-space: nowrap;
    position: relative;
    user-select: none;

    .Icon {
        svg {
            padding: 16%;
            ${(props) =>
                props.size === 'small' ? `width: 20px; height: 20px;` : ''}
        }
        margin-left: -4px;
    }

    .Icon + div {
        margin-left: 4px;
        margin-top: 1.5px;
    }

    &.icon-only {
        .Icon {
            margin-left: 0px;
        }
    }

    &:not(.icon-only) {
        .Icon {
            margin-right: 2px;
        }
    }

    .ping-message {
        position: absolute;
        cursor: default;
        border-radius: 100px;
        background-color: var(--color-accent-lightest);

        right: -8px;
        top: -8px;

        padding: 1px 6px 0px 6px;

        color: var(--color-accent-dark);
        font-size: var(--xsmall-text-size);
        font-weight: var(--bold-font);
    }

    /** uppercase */
    ${(props) => (props.uppercase ? `text-transform: uppercase;` : '')}
    /** disabled */
    ${(props) => (props.disabled ? `filter: opacity(50%);` : '')}


    /** fullWidth */
    ${(props) =>
        props.fullWidth &&
        `
        display: flex;
        justify-content: center;
        margin: 0px;
        border-radius: 0px;
        padding: 8px;
    `}

    /** attached */
    ${(props) =>
        props.attached === 'right'
            ? `
    border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        margin-right: 0px;
        + .Button {
            border-left: 0px;
        }
    `
            : props.attached === 'left'
            ? `
    border-top-left-radius: 0px;
        border-bottom-left-radius: 0px;
        margin-left: 0px;
    `
            : null}

    /** pushable */
    ${(props) =>
        props.pushable
            ? `
    transition: transform 0.05s ease-out;
        &:active {
            transform: scale(0.95);
        }
    `
            : ''}
`;

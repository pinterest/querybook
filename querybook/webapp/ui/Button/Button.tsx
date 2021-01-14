import React from 'react';
import classNames from 'classnames';

import { Icon } from 'ui/Icon/Icon';

import './Button.scss';

export const ButtonTypes = [
    '',
    'soft',
    'inlineText',
    'confirm',
    'cancel',
    'fullWidth',
] as const;

export interface IButtonProps
    extends React.AnchorHTMLAttributes<HTMLDivElement> {
    icon?: string;
    title?: string;
    className?: string;

    type?: typeof ButtonTypes[number];

    disabled?: boolean;

    borderless?: boolean;
    pushable?: boolean;
    transparent?: boolean;
    small?: boolean;
    inverted?: boolean;
    attachedRight?: boolean;
    attachedLeft?: boolean;
    isLoading?: boolean;
    ping?: string;
}

const defaultProps: IButtonProps = {
    className: '',
};

export const Button = React.forwardRef<HTMLDivElement, IButtonProps>(
    (props, ref) => {
        const {
            icon,
            title,
            children,
            disabled,
            onClick,
            className,
            type = null,
            borderless = false,
            pushable = false,
            transparent = false,
            small = false,
            inverted = false,
            attachedRight = false,
            attachedLeft = false,
            isLoading = false,
            ping = null,
            ...elementProps
        } = props;

        const iconDOM = isLoading ? (
            <Icon name="loader" />
        ) : (
            icon && <Icon name={icon} />
        );
        const textDOM = title && <span>{title}</span>;

        const buttonOnClick = disabled ? null : onClick;
        const typeClass = type
            ? type === 'inlineText'
                ? 'inline-text'
                : type === 'fullWidth'
                ? 'full-width'
                : type
            : '';

        const buttonClassName = classNames({
            Button: true,
            [className]: !!className,
            [typeClass]: true,
            'attached-right': attachedRight,
            'attached-left': attachedLeft,
            disabled,
            borderless,
            transparent,
            pushable,
            small,
            inverted,
            'flex-row': Boolean(iconDOM && textDOM),
            'icon-only': Boolean(iconDOM && !textDOM),
        });

        const pingDOM = !ping ? null : (
            <div className="ping-message">{ping}</div>
        );
        return (
            <span
                className={buttonClassName}
                {...elementProps}
                ref={ref}
                onClick={buttonOnClick}
            >
                {pingDOM}
                {iconDOM}
                {textDOM}
                {children}
            </span>
        );
    }
);

Button.defaultProps = defaultProps;

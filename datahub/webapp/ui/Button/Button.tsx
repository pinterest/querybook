import React from 'react';
import classNames from 'classnames';

import { Icon } from 'ui/Icon/Icon';

import './Button.scss';

export interface IButtonProps
    extends React.AnchorHTMLAttributes<HTMLDivElement> {
    icon?: string;
    title?: string;
    className?: string;

    type?: 'soft' | 'inlineText' | 'confirm' | 'cancel' | 'fullWidth';

    disabled?: boolean;

    borderless?: boolean;
    pushable?: boolean;
    transparent?: boolean;
    small?: boolean;
    inverted?: boolean;
    attachedRight?: boolean;
    attachedLeft?: boolean;
    isLoading?: boolean;
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
        });

        return (
            <span
                className={buttonClassName}
                {...elementProps}
                ref={ref}
                onClick={buttonOnClick}
            >
                {iconDOM}
                {textDOM}
                {children}
            </span>
        );
    }
);

Button.defaultProps = defaultProps;

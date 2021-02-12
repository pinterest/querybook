import React from 'react';
import classNames from 'classnames';

import { Icon, IIconProps } from 'ui/Icon/Icon';
import { StyledButton, ISharedButtonProps } from './StyledButton';
import { withBoundProps } from 'lib/utils/react-bind';
import {
    ButtonColorType,
    ButtonThemeType,
    computeStyleButtonProps,
} from './ButtonTheme';

export type ButtonProps = React.HTMLAttributes<HTMLSpanElement> &
    ISharedButtonProps & {
        icon?: string | React.ComponentType<IIconProps>;
        title?: string;
        className?: string;

        color?: ButtonColorType;
        theme?: ButtonThemeType;

        disabled?: boolean;
        isLoading?: boolean;
        active?: boolean;
        ping?: string;
    };

const defaultProps: ButtonProps = {
    className: '',
    color: 'default',
    theme: 'outline',
    size: 'medium',
};

export const Button = React.forwardRef<HTMLSpanElement, ButtonProps>(
    (props, ref) => {
        const {
            children,
            icon,
            title,
            className,
            color,
            theme,
            disabled,
            onClick,
            active = false,
            isLoading = false,
            ping = null,
            ...elementProps
        } = props;

        const iconDOM = isLoading ? (
            <Icon name="loader" />
        ) : (
            icon && (typeof icon === 'string' ? <Icon name={icon} /> : icon)
        );
        const textDOM = title && <span>{title}</span>;

        const buttonOnClick = disabled ? null : onClick;
        const themeProps = computeStyleButtonProps(color, theme);

        const buttonClassName = classNames({
            Button: true,
            [className]: !!className,
            active,
            'flex-row': Boolean(iconDOM && textDOM),
            'icon-only': Boolean(iconDOM && !textDOM),
        });

        const pingDOM = !ping ? null : (
            <div className="ping-message">{ping}</div>
        );
        return (
            <StyledButton
                className={buttonClassName}
                disabled={disabled}
                {...themeProps}
                {...elementProps}
                ref={ref}
                onClick={buttonOnClick}
            >
                {pingDOM}
                {iconDOM}
                {textDOM}
                {children}
            </StyledButton>
        );
    }
);

Button.defaultProps = defaultProps;
Button.displayName = 'Button';

export const TextButton = withBoundProps(Button, {
    theme: 'text',
    fontWeight: '700',
    uppercase: true,
    pushable: true,
});

export const SoftButton = withBoundProps(Button, {
    theme: 'fill',
    color: 'light',
    fontWeight: '700',
    pushable: true,
});

export type ButtonType = 'soft' | 'text' | 'default';

const buttonComponentByType: Record<
    ButtonType,
    React.ComponentType<ButtonProps>
> = {
    soft: SoftButton,
    text: TextButton,
    default: Button,
};
export function getButtonComponentByType(buttonType?: ButtonType) {
    buttonType = buttonType ?? 'default';
    return buttonComponentByType[buttonType];
}

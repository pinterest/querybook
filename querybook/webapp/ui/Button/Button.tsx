import clsx from 'clsx';
import React from 'react';

import { withBoundProps } from 'lib/utils/react-bind';
import { Icon, IIconProps } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { AccentText } from 'ui/StyledText/StyledText';

import {
    ButtonColorType,
    ButtonThemeType,
    computeStyleButtonProps,
} from './ButtonTheme';
import { ISharedButtonProps, StyledButton } from './StyledButton';

export type ButtonProps = React.HTMLAttributes<HTMLSpanElement> &
    ISharedButtonProps & {
        icon?: AllLucideIconNames | React.ReactElement<IIconProps>;
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
    theme: 'fill',
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
            <Icon name="Loading" />
        ) : (
            icon && (typeof icon === 'string' ? <Icon name={icon} /> : icon)
        );
        const textDOM = title ? <AccentText>{title}</AccentText> : null;

        const buttonOnClick = disabled ? null : onClick;
        const themeProps = computeStyleButtonProps(color, theme);

        const buttonClassName = clsx({
            Button: true,
            [className]: !!className,
            active,
            'flex-row': Boolean(iconDOM && textDOM),
            'icon-only': Boolean(iconDOM && !textDOM && !children),
            [theme]: true,
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
                <AccentText className="flex-row">{children}</AccentText>
            </StyledButton>
        );
    }
);

Button.defaultProps = defaultProps;
Button.displayName = 'Button';

export const TextButton = withBoundProps(Button, {
    theme: 'text',
    fontWeight: '700',
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

import { IStyledButtonThemeProps } from './StyledButton';

export const ButtonColors = [
    'confirm',
    'cancel',
    'accent',
    'light',
    'default',
] as const;
export const ButtonThemes = ['outline', 'text', 'fill'] as const;

export type ButtonColorType = typeof ButtonColors[number];
export type ButtonThemeType = typeof ButtonThemes[number];

interface IButtonColorConfig {
    primary: string; // text and icon
    primaryHover?: string;
    secondary: string; // Background and border
    secondaryHover?: string;
}

const buttonThemeToProps: Record<ButtonColorType, IButtonColorConfig> = {
    confirm: {
        primary: 'var(--color-true-dark)',
        secondary: 'var(--color-true-dark)',
        secondaryHover: 'var(--color-true)',
    },
    cancel: {
        primary: 'var(--color-false-dark)',
        secondary: 'var(--color-false-dark)',
        secondaryHover: 'var(--color-false)',
    },
    accent: {
        primary: 'var(--color-accent-text)',
        secondary: 'var(--color-accent-bg)',
    },
    light: {
        primary: 'var(--light-text-color)',
        primaryHover: 'var(--text-color)',
        secondary: 'var(--bg-lightest)',
        secondaryHover: 'var(--bg-hover)',
    },
    default: {
        primary: 'var(--light-text-color)',
        primaryHover: 'var(--text-color)',
        secondary: 'var(--bg-light)',
        secondaryHover: 'var(--bg-hover)',
    },
};

export function computeStyleButtonProps(
    colorType: ButtonColorType,
    theme: ButtonThemeType
) {
    const colorConfig = buttonThemeToProps[colorType];
    const secondaryIsPrimary = colorConfig.secondary === colorConfig.primary;
    const themeProps: IStyledButtonThemeProps = {};

    if (theme === 'fill') {
        if (!secondaryIsPrimary) {
            themeProps.color = colorConfig.primary;
            themeProps.hoverColor =
                colorConfig.primaryHover || colorConfig.primary;
            themeProps.bgColor = colorConfig.secondary;
            themeProps.hoverBgColor =
                colorConfig.secondaryHover || colorConfig.secondary;
        } else {
            themeProps.color = 'var(--bg)';
            themeProps.hoverColor = 'var(--bg-light)';
            themeProps.bgColor = colorConfig.primary;
            themeProps.hoverBgColor =
                colorConfig.primaryHover || colorConfig.primary;
        }
    } else if (theme === 'text') {
        themeProps.color = colorConfig.primary;
        themeProps.hoverColor = colorConfig.primaryHover || colorConfig.primary;
        themeProps.bgColor = 'transparent';
        themeProps.hoverBgColor = 'var(--bg-light)';
    }

    return themeProps;
}

import { IStyledButtonThemeProps } from './StyledButton';

export const ButtonColors = [
    'confirm',
    'cancel',
    'accent',
    'light',
    'default',
] as const;
export const ButtonThemes = ['text', 'fill'] as const;

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
        primary: 'var(--color-true)',
        primaryHover: 'var(--color-true-dark)',
        secondary: 'var(--color-true-lightest-0)',
        secondaryHover: 'var(--color-true-lightest)',
    },
    cancel: {
        primary: 'var(--color-false)',
        primaryHover: 'var(--color-false-dark)',
        secondary: 'var(--color-false-lightest-0)',
        secondaryHover: 'var(--color-false-lightest)',
    },
    accent: {
        primary: 'var(--color-accent)',
        primaryHover: 'var(--color-accent-dark)',
        secondary: 'var(--color-accent-lightest-0)',
        secondaryHover: 'var(--color-accent-lightest)',
    },
    light: {
        primary: 'var(--text-light)',
        primaryHover: 'var(--text-hover)',
        secondary: 'var(--bg-lightest)',
        secondaryHover: 'var(--bg-hover)',
    },
    default: {
        primary: 'var(--text-light)',
        primaryHover: 'var(--text-hover)',
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
            themeProps.hoverColor = 'var(--text-hover)';
            themeProps.bgColor = colorConfig.primary;
            themeProps.hoverBgColor =
                colorConfig.primaryHover || colorConfig.primary;
        }
    } else if (theme === 'text') {
        themeProps.color = colorConfig.primary;
        themeProps.hoverColor = colorConfig.primaryHover || colorConfig.primary;
        themeProps.bgColor = 'transparent';
        themeProps.hoverBgColor = 'var(--bg-hover)';
    }

    return themeProps;
}

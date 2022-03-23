import React from 'react';
import type { LucideProps, Icon as LucideIcon } from 'lucide-react';
import AllLucideIcons, { AllLucideIconNames } from './LucideIcons';
import './Icon.scss';
import clsx from 'clsx';

// Wrapper for feather icon
export interface IIconProps {
    className?: string;
    size?: string | number;
    name: AllLucideIconNames | 'Loading';
    options?: LucideProps;
    fill?: boolean;
    color?: TButtonColors;
}

export type TButtonColors = 'accent' | 'true' | 'false' | 'warning' | 'light';

export const Icon: React.FunctionComponent<IIconProps> = React.memo(
    ({
        name,
        className = '',
        size,
        options = {},
        fill = false,
        color = '',
    }) => {
        if (!(name in AllLucideIcons) && name !== 'Loading') {
            return null;
        }
        const LucideIconComponent: LucideIcon =
            AllLucideIcons[name === 'Loading' ? 'Circle' : name];

        const iconClassName = clsx({
            Icon: true,
            [className]: Boolean(className),
            fill,
            [color]: Boolean(color),
            'loading-icon': name === 'Loading',
        });

        return (
            <span className={iconClassName}>
                <LucideIconComponent {...options} size={size} />
            </span>
        );
    }
);

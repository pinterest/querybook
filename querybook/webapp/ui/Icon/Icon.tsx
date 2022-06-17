import clsx from 'clsx';
import type { Icon as LucideIcon, LucideProps } from 'lucide-react';
import React from 'react';

import AllLucideIcons, { AllLucideIconNames } from './LucideIcons';

import './Icon.scss';

// Wrapper for feather icon
export interface IIconProps {
    className?: string;
    size?: string | number;
    name: AllLucideIconNames;
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
        if (!(name in AllLucideIcons)) {
            return null;
        }
        const LucideIconComponent: LucideIcon = AllLucideIcons[name];

        const iconClassName = clsx('Icon', className, color, {
            fill,
            'loading-icon': name === 'Loading',
        });

        return (
            <span className={iconClassName}>
                <LucideIconComponent {...options} size={size} />
            </span>
        );
    }
);
